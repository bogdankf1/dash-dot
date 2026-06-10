import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Edge middleware only decodes the JWT (no DB), so it uses the edge-safe config.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Authed users have no reason to see /login — bounce them to the dashboard.
  // (We intentionally do NOT redirect unauthenticated users anywhere; the app
  // is usable as a guest.)
  if (req.auth && pathname === '/login') {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
