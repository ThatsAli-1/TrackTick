import { connectMongo, getDb, nextSequence } from "@/lib/mongo";

type SessionRow = {
  id: number;
  mode: string;
  durationSeconds: number;
  completedAt: string;
};

export async function GET() {
  await connectMongo();
  const rows = await getDb()
    .collection<SessionRow>("pomodoro_sessions")
    .find({}, { projection: { _id: 0 } })
    .sort({ completedAt: -1 })
    .toArray();
  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { mode?: string; durationSeconds?: number };
  const mode = body.mode?.trim() || "focus";
  const durationSeconds = Number(body.durationSeconds ?? 0);

  if (!durationSeconds || Number.isNaN(durationSeconds) || durationSeconds < 1) {
    return Response.json({ error: "Duration must be a positive number." }, { status: 400 });
  }

  await connectMongo();
  const db = getDb();
  const completedAt = new Date().toISOString();
  const id = await nextSequence(db, "pomodoro_sessions");

  await db.collection<SessionRow>("pomodoro_sessions").insertOne({
    id,
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
}
