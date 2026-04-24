import { connectMongo, getDb, nextSequence, type TaskRow } from "@/lib/mongo";

export async function GET() {
  await connectMongo();
  const db = getDb();
  const rows = (await db
    .collection<TaskRow>("tasks")
    .find({}, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray()) as TaskRow[];
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

  await connectMongo();
  const db = getDb();
  const priority = body.priority ?? "medium";
  const createdAt = new Date().toISOString();
  const id = await nextSequence(db, "tasks");

  await db.collection<TaskRow>("tasks").insertOne({
    id,
    title: body.title.trim(),
    done: false,
    priority,
    dueDate: body.dueDate ?? null,
    createdAt,
  });

  return Response.json({
    id,
    title: body.title.trim(),
    done: false,
    priority,
    dueDate: body.dueDate ?? null,
    createdAt,
  });
}
