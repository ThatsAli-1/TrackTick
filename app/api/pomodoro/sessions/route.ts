import db from "@/lib/db";

export async function GET() {
  const rows = db
    .prepare("SELECT id, mode, durationSeconds, completedAt FROM pomodoro_sessions ORDER BY completedAt DESC")
    .all();
  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { mode?: string; durationSeconds?: number };
  const mode = body.mode?.trim() || "focus";
  const durationSeconds = Number(body.durationSeconds ?? 0);

  if (!durationSeconds || Number.isNaN(durationSeconds) || durationSeconds < 1) {
    return Response.json({ error: "Duration must be a positive number." }, { status: 400 });
  }

  const completedAt = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO pomodoro_sessions (mode, durationSeconds, completedAt) VALUES (?, ?, ?)")
    .run(mode, durationSeconds, completedAt);

  return Response.json({
    id: info.lastInsertRowid,
    mode,
    durationSeconds,
    completedAt,
  });
}
