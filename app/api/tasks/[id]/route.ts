import { connectMongo, getDb } from "@/lib/mongo";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
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

  await connectMongo();
  const db = getDb();
  const existing = await db.collection("tasks").findOne({ id });
  if (!existing) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  const $set: Record<string, unknown> = {};
  if (typeof body.done === "boolean") $set.done = body.done;
  if (body.title !== undefined) $set.title = body.title;
  if (body.priority !== undefined) $set.priority = body.priority;
  if (body.dueDate !== undefined) $set.dueDate = body.dueDate;

  if (Object.keys($set).length > 0) {
    await db.collection("tasks").updateOne({ id }, { $set });
  }

  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  await connectMongo();
  await getDb().collection("tasks").deleteOne({ id });
  return Response.json({ ok: true });
}
