import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql } from '@/lib/db/client';
import { updateProfileSchema } from '@/lib/validation/schemas';

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const rawOffset = parseInt(searchParams.get('timezoneOffset') ?? '0', 10);
  const timezoneOffset = Number.isNaN(rawOffset) ? 0 : Math.max(-720, Math.min(840, rawOffset));

  // Reset the streak first via an atomic RPC, so the subsequent SELECT sees the
  // post-reset value. The RPC is a no-op when the streak isn't broken.
  await sql`select reset_streak_if_broken(${userId}::uuid, ${timezoneOffset})`;

  const profileRows = await sql`select * from profiles where id = ${userId}`;

  return NextResponse.json({ user: session.user, profile: profileRows[0] ?? null });
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
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

  const { username, selected_guide } = parsed.data;

  // Only the provided fields change; COALESCE keeps the existing value when a
  // field is absent (the schema forbids clearing either to null).
  const rows = await sql`
    update profiles set
      username = coalesce(${username ?? null}::text, username),
      selected_guide = coalesce(${selected_guide ?? null}::text, selected_guide)
    where id = ${userId}
    returning *
  `;

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: rows[0] });
}
