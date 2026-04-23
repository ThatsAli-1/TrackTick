import db, { type TaskRow } from "@/lib/db";

export async function GET() {
  const rows = db
    .prepare("SELECT id, title, done, priority, dueDate, createdAt FROM tasks ORDER BY createdAt DESC")
    .all() as TaskRow[];
  return Response.json(
    rows.map((row) => ({
      ...row,
      done: Boolean(row.done),
    })),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title?: string;
    priority?: "low" | "medium" | "high";
    dueDate?: string;
  };

  if (!body.title?.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const priority = body.priority ?? "medium";
  const createdAt = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO tasks (title, done, priority, dueDate, createdAt) VALUES (?, 0, ?, ?, ?)")
    .run(body.title.trim(), priority, body.dueDate ?? null, createdAt);

  return Response.json({
    id: info.lastInsertRowid,
    title: body.title.trim(),
    done: false,
    priority,
    dueDate: body.dueDate ?? null,
    createdAt,
  });
}
