import db from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = (await request.json()) as {
    done?: boolean;
    title?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string | null;
  };

  const existing = db.prepare("SELECT id FROM tasks WHERE id = ?").get(id) as { id: number } | undefined;
  if (!existing) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  db.prepare(
    "UPDATE tasks SET done = COALESCE(?, done), title = COALESCE(?, title), priority = COALESCE(?, priority), dueDate = COALESCE(?, dueDate) WHERE id = ?",
  ).run(
    typeof body.done === "boolean" ? Number(body.done) : null,
    body.title ?? null,
    body.priority ?? null,
    body.dueDate ?? null,
    id,
  );

  return Response.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params;
  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  return Response.json({ ok: true });
}
