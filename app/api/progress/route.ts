import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db/client';
import { saveProgressSchema } from '@/lib/validation/schemas';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [letterProgress, lessonHistory, profileRows] = await Promise.all([
    sql`select * from letter_progress where user_id = ${userId}`,
    sql`select * from lesson_history where user_id = ${userId} order by completed_at desc`,
    sql`select xp from profiles where id = ${userId}`,
  ]);

  return NextResponse.json({
    letterProgress,
    lessonHistory,
    xp: profileRows[0]?.xp ?? 0,
  });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
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

  try {
    await sql`
      select save_lesson_progress(
        ${userId}::uuid,
        ${chapterId},
        ${lessonId},
        ${xpEarned},
        ${accuracy},
        ${JSON.stringify(symbolResults)}::jsonb,
        ${timezoneOffset}
      )
    `;
  } catch (err) {
    console.error('save_lesson_progress error:', err);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sql`delete from letter_progress where user_id = ${userId}`;
  await sql`delete from lesson_history where user_id = ${userId}`;
  await sql`update profiles set xp = 0, streak = 0, last_activity_date = null where id = ${userId}`;

  return NextResponse.json({ success: true });
}
