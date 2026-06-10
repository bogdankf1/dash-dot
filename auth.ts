import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { sql } from '@/lib/db/client';

// Avatar hosts we trust to render in <img>. Mirrors the old Supabase callback.
const TRUSTED_AVATAR_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
  'platform-lookaside.fbsbx.com',
  'cdn.discordapp.com',
]);

function sanitizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().slice(0, 50);
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeAvatarUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return null;
    if (!TRUSTED_AVATAR_HOSTS.has(url.hostname)) return null;
    return url.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // On the initial sign-in `user` is populated. Upsert the profile by email
      // (email is the stable identity key now that Auth.js owns auth) and stash
      // its id on the token for the session + API routes.
      if (user?.email) {
        const rows = await sql`
          insert into profiles (email, username, avatar_url)
          values (
            ${user.email},
            ${sanitizeUsername(user.name ?? user.email)},
            ${sanitizeAvatarUrl(user.image)}
          )
          on conflict (email) do update set
            username = excluded.username,
            avatar_url = excluded.avatar_url
          returning id
        `;
        token.uid = rows[0]?.id as string | undefined;
      }
      return token;
    },
  },
});
