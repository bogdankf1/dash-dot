import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: letterProgress } = await supabase
    .from('letter_progress')
    .select('*')
    .eq('user_id', user.id);

  const { data: lessonHistory } = await supabase
    .from('lesson_history')
    .select('*')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false });

  return NextResponse.json({ letterProgress, lessonHistory });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { chapterId, lessonId, xpEarned, accuracy, symbolResults } = body;

  // Save lesson history
  await supabase.from('lesson_history').insert({
    user_id: user.id,
    chapter_id: chapterId,
    lesson_id: lessonId,
    xp_earned: xpEarned,
    accuracy,
  });

  // Update letter progress for each symbol
  for (const result of symbolResults) {
    const { data: existing } = await supabase
      .from('letter_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', result.symbol)
      .single();

    if (existing) {
      await supabase
        .from('letter_progress')
        .update({
          mastery_level: result.masteryLevel,
          correct_count: existing.correct_count + result.correct,
          attempt_count: existing.attempt_count + result.attempts,
          last_seen: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('letter_progress').insert({
        user_id: user.id,
        symbol: result.symbol,
        mastery_level: result.masteryLevel,
        correct_count: result.correct,
        attempt_count: result.attempts,
        last_seen: new Date().toISOString(),
      });
    }
  }

  // Update user XP and streak
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, streak, last_activity_date')
    .eq('id', user.id)
    .single();

  if (profile) {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.last_activity_date;
    let newStreak = profile.streak;

    if (lastActivity !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivity === yesterdayStr) {
        newStreak += 1;
      } else if (lastActivity !== today) {
        newStreak = 1;
      }
    }

    await supabase
      .from('profiles')
      .update({
        xp: profile.xp + xpEarned,
        streak: newStreak,
        last_activity_date: today,
      })
      .eq('id', user.id);
  }

  return NextResponse.json({ success: true });
}
