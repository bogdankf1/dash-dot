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

export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

  let sent = 0;
  let failed = 0;

  for (const user of users) {
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (!subscriptions) continue;

    const message = user.streak > 0
      ? { title: `Your ${user.streak}-day streak is at risk!`, body: 'Practice now to keep it alive!' }
      : MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ ...message, url: '/dashboard' })
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // Remove expired subscriptions
        if (err && typeof err === 'object' && 'statusCode' in err && (err as { statusCode: number }).statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id);
        }
      }
    }
  }

  return NextResponse.json({ sent, failed, users: users.length });
}
