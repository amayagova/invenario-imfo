import { createClient } from '@libsql/client';
import 'server-only';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not defined in .env');
}
if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is not defined in .env');
}

// Ensure the URL uses the libsql protocol for WebSocket connection
const dbUrl = process.env.TURSO_DATABASE_URL.replace(/^http/, 'libsql');

export const db = createClient({
  url: dbUrl,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
