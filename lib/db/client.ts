import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// HTTP one-shot query driver — the Vercel-recommended path for serverless.
// Use as a tagged template: `await sql`select ... where id = ${userId}``.
// Returns an array of rows; values are passed as parameters, not interpolated.
export const sql = neon(process.env.DATABASE_URL);
