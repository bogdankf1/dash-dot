import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { saveProgressSchema } from '@/lib/validation/schemas';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: letterProgress }, { data: lessonHistory }, { data: profile }] =
    await Promise.all([
      supabase
        .from('letter_progress')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('lesson_history')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('xp')
        .eq('id', user.id)
        .single(),
    ]);

  return NextResponse.json({
    letterProgress,
    lessonHistory,
    xp: profile?.xp ?? 0,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = saveProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { chapterId, lessonId, xpEarned, accuracy, symbolResults, timezoneOffset } = parsed.data;

  const { error } = await supabase.rpc('save_lesson_progress', {
    p_user_id: user.id,
    p_chapter_id: chapterId,
    p_lesson_id: lessonId,
    p_xp_earned: xpEarned,
    p_accuracy: accuracy,
    p_symbol_results: symbolResults,
    p_timezone_offset: timezoneOffset,
  });

  if (error) {
    console.error('save_lesson_progress RPC error:', error);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await supabase.from('letter_progress').delete().eq('user_id', user.id);
  await supabase.from('lesson_history').delete().eq('user_id', user.id);
  await supabase.from('profiles').update({
    xp: 0,
    streak: 0,
    last_activity_date: null,
  }).eq('id', user.id);

  return NextResponse.json({ success: true });
}
