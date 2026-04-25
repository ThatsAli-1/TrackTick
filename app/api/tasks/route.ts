import { getSessionUserId } from "@/lib/auth-session";
import { nextSequence, withDb, type TaskRow } from "@/lib/mongo";
import type { Task } from "@/lib/types";

const PROJECTION = { _id: 0, userId: 0 } as const;

export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json([]);
  }

  return withDb(async (db) => {
    const rows = (await db
      .collection<TaskRow>("tasks")
      .find({ userId }, { projection: PROJECTION })
      .sort({ createdAt: -1 })
      .toArray()) as Task[];
    return Response.json(
      rows.map((row) => ({
        ...row,
        done: Boolean(row.done),
      })),
    );
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json({ error: "Sign in to add tasks." }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
  };

  const title = body.title?.trim();
  if (!title) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  return withDb(async (db) => {
    const priority = body.priority ?? "medium";
    const createdAt = new Date().toISOString();
    const id = await nextSequence(db, "tasks");

    await db.collection<TaskRow>("tasks").insertOne({
      id,
      userId,
      title,
      done: false,
      priority,
      dueDate: body.dueDate ?? null,
      createdAt,
    });

    return Response.json({
      id,
      title,
      done: false,
      priority,
      dueDate: body.dueDate ?? null,
      createdAt,
    });
  });
}
