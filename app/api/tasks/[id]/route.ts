import { getSessionUserId } from "@/lib/auth-session";
import { withDb } from "@/lib/mongo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json({ error: "Sign in to update tasks." }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  const body = (await request.json()) as {
    done?: boolean;
    title?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string | null;
  };

  return withDb(async (db) => {
    const existing = await db.collection("tasks").findOne({ id, userId });
    if (!existing) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }

    const $set: Record<string, unknown> = {};
    if (typeof body.done === "boolean") $set.done = body.done;
    if (body.title !== undefined) $set.title = body.title;
    if (body.priority !== undefined) $set.priority = body.priority;
    if (body.dueDate !== undefined) $set.dueDate = body.dueDate;

    if (Object.keys($set).length > 0) {
      await db.collection("tasks").updateOne({ id, userId }, { $set });
    }

    return Response.json({ ok: true });
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json({ error: "Sign in to delete tasks." }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  return withDb(async (db) => {
    const { deletedCount } = await db.collection("tasks").deleteOne({ id, userId });
    if (deletedCount === 0) {
      return Response.json({ error: "Task not found." }, { status: 404 });
    }
    return Response.json({ ok: true });
  });
}
