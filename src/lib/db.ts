import { createClient } from '@libsql/client';
import 'server-only';

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not defined in .env');
}
if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is not defined in .env');
}

// Create a URL object to safely add query parameters
const dbUrl = new URL(process.env.TURSO_DATABASE_URL);
// This parameter helps prevent read-after-write inconsistencies and can resolve sync issues.
dbUrl.searchParams.set('read_your_writes', 'true');

export const db = createClient({
  url: dbUrl.toString(),
  authToken: process.env.TURSO_AUTH_TOKEN,
});
