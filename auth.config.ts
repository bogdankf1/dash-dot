import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Edge-safe base config shared by the Edge middleware and the full server
 * config in `auth.ts`. Keep this free of database access (and anything not
 * Edge-compatible) so it can run inside the middleware bundle. Reads
 * AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET from the environment.
 */
export const authConfig = {
  providers: [Google],
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    // Surface the profile id (resolved in the jwt callback) onto the session
    // so API routes can read `session.user.id`.
    session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
