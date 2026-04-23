import Database from "better-sqlite3";

const db = new Database("./local.db");

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    priority TEXT NOT NULL DEFAULT 'medium',
    dueDate TEXT,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,
    durationSeconds INTEGER NOT NULL,
    completedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    eventDate TEXT NOT NULL,
    note TEXT,
    createdAt TEXT NOT NULL
  );
`);

export type TaskRow = {
  id: number;
  title: string;
  done: number;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
};

export default db;
