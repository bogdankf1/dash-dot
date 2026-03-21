import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = subscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid subscription', details: parsed.error.issues }, { status: 400 });
  }

  const { endpoint, keys } = parsed.data;

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      { user_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'user_id,endpoint' }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Update profile
  await supabase
    .from('profiles')
    .update({ notifications_enabled: true })
    .eq('id', user.id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint } = body;

  if (endpoint) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);
  }

  // Check if user has any remaining subscriptions
  const { data: remaining } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .limit(1);

  if (!remaining || remaining.length === 0) {
    await supabase
      .from('profiles')
      .update({ notifications_enabled: false })
      .eq('id', user.id);
  }

  return NextResponse.json({ ok: true });
}
