import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { updateProfileSchema } from '@/lib/validation/schemas';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawOffset = parseInt(searchParams.get('timezoneOffset') ?? '0', 10);
  const timezoneOffset = Number.isNaN(rawOffset) ? 0 : Math.max(-720, Math.min(840, rawOffset));

  // Reset the streak first via an atomic RPC, so the subsequent SELECT sees the
  // post-reset value. The RPC is a no-op when the streak isn't broken.
  await supabase.rpc('reset_streak_if_broken', {
    p_user_id: user.id,
    p_timezone_offset: timezoneOffset,
  });

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return NextResponse.json({ user, profile });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: data });
}
