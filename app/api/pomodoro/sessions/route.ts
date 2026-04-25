import { getSessionUserId } from "@/lib/auth-session";
import { nextSequence, withDb } from "@/lib/mongo";
import type { PomodoroSession } from "@/lib/types";

type PomodoroRow = PomodoroSession & { userId: string };

export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json([]);
  }

  return withDb(async (db) => {
    const rows = await db
      .collection<PomodoroRow>("pomodoro_sessions")
      .find({ userId }, { projection: { _id: 0, userId: 0 } })
      .sort({ completedAt: -1 })
      .toArray();
    return Response.json(rows);
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json({ error: "Sign in to log sessions." }, { status: 401 });
  }

  const body = (await request.json()) as { mode?: string; durationSeconds?: number };
  const mode = body.mode?.trim() || "focus";
  const durationSeconds = Number(body.durationSeconds ?? 0);

  if (!durationSeconds || Number.isNaN(durationSeconds) || durationSeconds < 1) {
    return Response.json({ error: "Duration must be a positive number." }, { status: 400 });
  }

  return withDb(async (db) => {
    const completedAt = new Date().toISOString();
    const id = await nextSequence(db, "pomodoro_sessions");

    await db.collection<PomodoroRow>("pomodoro_sessions").insertOne({
      id,
      userId,
      mode,
      durationSeconds,
      completedAt,
    });

    return Response.json({
      id,
      mode,
      durationSeconds,
      completedAt,
    });
  });
}
