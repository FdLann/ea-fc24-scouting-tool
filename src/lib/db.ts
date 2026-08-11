import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'fc24_players.db');

let db: Database.Database;

try {
  db = new Database(dbPath, { readonly: true, fileMustExist: true });
} catch (error) {
  console.error("Failed to connect to SQLite database:", error);
  throw error;
}

export default db;
