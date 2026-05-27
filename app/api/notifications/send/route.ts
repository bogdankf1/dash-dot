import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@dashdot.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

const MESSAGES = [
  { title: 'Time to practice!', body: 'Your daily Morse code practice is waiting ·−·· · − ·−−· ·−·' },
  { title: 'Keep your streak alive!', body: "Don't let your streak slip — a quick session keeps it going!" },
  { title: '−·· ·− ··· ···· −·· −−− −', body: 'Can you decode this? Tap to practice!' },
  { title: 'Dash Dot misses you!', body: 'Just 5 minutes of practice makes a difference ·−··' },
];

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function POST(request: Request) {
  // Verify cron secret using a constant-time compare. Accept either the legacy
  // Authorization: Bearer header or Vercel's signed cron header.
  const expected = process.env.CRON_SECRET ?? '';
  const authHeader = request.headers.get('authorization') ?? '';
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  const bearerMatches =
    expected.length > 0 &&
    authHeader.startsWith('Bearer ') &&
    timingSafeEqual(authHeader.slice('Bearer '.length), expected);
  if (!bearerMatches && !vercelCronHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // Get users with notifications enabled who haven't practiced today
  const today = new Date().toISOString().split('T')[0];
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, last_activity_date, streak')
    .eq('notifications_enabled', true)
    .or(`last_activity_date.is.null,last_activity_date.neq.${today}`);

  if (error || !users) {
    return NextResponse.json({ error: error?.message || 'No users found' }, { status: 500 });
  }

  // Fan out subscription lookups in parallel so the wall-clock time scales with
  // the slowest user, not the sum across users.
  const subsByUser = await Promise.all(
    users.map(async (user) => {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', user.id);
      return { user, subs: subs ?? [] };
    })
  );

  type SendTask = {
    userId: string;
    subId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    payload: string;
  };
  const tasks: SendTask[] = [];
  for (const { user, subs } of subsByUser) {
    const message =
      user.streak > 0
        ? { title: `Your ${user.streak}-day streak is at risk!`, body: 'Practice now to keep it alive!' }
        : MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
    const payload = JSON.stringify({ ...message, url: '/dashboard' });
    for (const sub of subs) {
      tasks.push({
        userId: user.id,
        subId: sub.id,
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
        payload,
      });
    }
  }

  const results = await Promise.allSettled(
    tasks.map((task) =>
      webpush.sendNotification(
        { endpoint: task.endpoint, keys: { p256dh: task.p256dh, auth: task.auth } },
        task.payload
      )
    )
  );

  let sent = 0;
  let failed = 0;
  const expiredSubIds: string[] = [];
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      sent++;
    } else {
      failed++;
      const err = res.reason;
      if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
        expiredSubIds.push(tasks[i].subId);
      }
    }
  });

  if (expiredSubIds.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expiredSubIds);
  }

  return NextResponse.json({ sent, failed, users: users.length });
}
