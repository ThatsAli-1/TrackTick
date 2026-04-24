import { connectMongo, getDb, nextSequence } from "@/lib/mongo";

type EventRow = {
  id: number;
  title: string;
  eventDate: string;
  note: string | null;
  createdAt: string;
};

export async function GET() {
  await connectMongo();
  const rows = await getDb()
    .collection<EventRow>("calendar_events")
    .find({}, { projection: { _id: 0 } })
    .sort({ eventDate: 1 })
    .toArray();
  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = (await request.json()) as { title?: string; eventDate?: string; note?: string };
  if (!body.title?.trim() || !body.eventDate?.trim()) {
    return Response.json({ error: "Title and date are required." }, { status: 400 });
  }

  await connectMongo();
  const db = getDb();
  const createdAt = new Date().toISOString();
  const id = await nextSequence(db, "calendar_events");

  await db.collection<EventRow>("calendar_events").insertOne({
    id,
    title: body.title.trim(),
    eventDate: body.eventDate,
    note: body.note ?? null,
    createdAt,
  });

  return Response.json({
    id,
    title: body.title.trim(),
    eventDate: body.eventDate,
    note: body.note ?? null,
    createdAt,
  });
}
