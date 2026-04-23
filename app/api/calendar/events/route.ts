import db from "@/lib/db";

export async function GET() {
  const rows = db
    .prepare("SELECT id, title, eventDate, note, createdAt FROM calendar_events ORDER BY eventDate ASC")
    .all();
  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; eventDate?: string; note?: string };
  if (!body.title?.trim() || !body.eventDate?.trim()) {
    return Response.json({ error: "Title and date are required." }, { status: 400 });
  }

  const createdAt = new Date().toISOString();
  const info = db
    .prepare("INSERT INTO calendar_events (title, eventDate, note, createdAt) VALUES (?, ?, ?, ?)")
    .run(body.title.trim(), body.eventDate, body.note ?? null, createdAt);

  return Response.json({
    id: info.lastInsertRowid,
    title: body.title.trim(),
    eventDate: body.eventDate,
    note: body.note ?? null,
    createdAt,
  });
}
