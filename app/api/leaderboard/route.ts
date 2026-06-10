import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db/client';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const leaderboard = await sql`select * from get_leaderboard(100)`;

  return NextResponse.json({ leaderboard, currentUserId: userId });
}
