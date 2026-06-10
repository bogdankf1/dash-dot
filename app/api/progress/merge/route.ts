import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db/client';
import { mergeSnapshotSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
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

  try {
    await sql`
      select merge_guest_progress(
        ${userId}::uuid,
        ${JSON.stringify(profile)}::jsonb,
        ${JSON.stringify(letterProgress)}::jsonb,
        ${JSON.stringify(lessonHistory)}::jsonb
      )
    `;
  } catch (err) {
    console.error('merge_guest_progress error:', err);
    return NextResponse.json({ error: 'Failed to merge progress' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
