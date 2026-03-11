import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { updateProfileSchema } from '@/lib/validation/schemas';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read timezone offset from query params
  const { searchParams } = new URL(request.url);
  const rawOffset = parseInt(searchParams.get('timezoneOffset') ?? '0', 10);
  const timezoneOffset = Number.isNaN(rawOffset) ? 0 : Math.max(-720, Math.min(840, rawOffset));

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Check streak validity using user's local date
  if (profile) {
    const now = new Date();
    const localNow = new Date(now.getTime() - timezoneOffset * 60_000);
    const today = localNow.toISOString().split('T')[0];
    const yesterdayDate = new Date(localNow);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    if (
      profile.last_activity_date &&
      profile.last_activity_date !== today &&
      profile.last_activity_date !== yesterdayStr
    ) {
      // Streak is broken — reset it
      await supabase
        .from('profiles')
        .update({ streak: 0 })
        .eq('id', user.id);
      profile.streak = 0;
    }
  }

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
