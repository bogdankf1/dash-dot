import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { mergeSnapshotSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = mergeSnapshotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { profile, letterProgress, lessonHistory } = parsed.data;

  const { error } = await supabase.rpc('merge_guest_progress', {
    p_user_id: user.id,
    p_profile: profile,
    p_letter_progress: letterProgress,
    p_lesson_history: lessonHistory,
  });

  if (error) {
    console.error('merge_guest_progress RPC error:', error);
    return NextResponse.json({ error: 'Failed to merge progress' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
