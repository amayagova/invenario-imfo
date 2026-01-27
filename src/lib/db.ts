import Database from 'better-sqlite3';
import 'server-only';

// The database is a singleton.
export const db = new Database('local.db');
// Ensure WAL mode is enabled for better concurrency.
db.pragma('journal_mode = WAL');
