import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { sql } from '@/lib/db/client';
import { pushSubscriptionSchema } from '@/lib/validation/schemas';

const unsubscribeSchema = z.object({
  endpoint: z.string().url().max(2048).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = pushSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription', details: parsed.error.issues }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  await sql`
    insert into push_subscriptions (user_id, endpoint, p256dh, auth)
    values (${userId}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
    on conflict (user_id, endpoint) do update set
      p256dh = excluded.p256dh,
      auth = excluded.auth
  `;

  await sql`update profiles set notifications_enabled = true where id = ${userId}`;

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
  }
  const { endpoint } = parsed.data;

  if (endpoint) {
    await sql`delete from push_subscriptions where user_id = ${userId} and endpoint = ${endpoint}`;
  }

  // Check if user has any remaining subscriptions
  const remaining = await sql`select id from push_subscriptions where user_id = ${userId} limit 1`;

  if (remaining.length === 0) {
    await sql`update profiles set notifications_enabled = false where id = ${userId}`;
  }

  return NextResponse.json({ ok: true });
}
