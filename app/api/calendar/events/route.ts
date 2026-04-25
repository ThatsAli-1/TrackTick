import { getSessionUserId } from "@/lib/auth-session";
import { nextSequence, withDb } from "@/lib/mongo";
import type { CalendarEvent } from "@/lib/types";

type CalendarRow = CalendarEvent & { userId: string };

export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json([]);
  }

  return withDb(async (db) => {
    const rows = await db
      .collection<CalendarRow>("calendar_events")
      .find({ userId }, { projection: { _id: 0, userId: 0 } })
      .sort({ eventDate: 1 })
      .toArray();
    return Response.json(rows);
  });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json({ error: "Sign in to add events." }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string; eventDate?: string; note?: string };
  const title = body.title?.trim();
  const eventDate = body.eventDate?.trim();
  if (!title || !eventDate) {
    return Response.json({ error: "Title and date are required." }, { status: 400 });
  }

  return withDb(async (db) => {
    const createdAt = new Date().toISOString();
    const id = await nextSequence(db, "calendar_events");

    await db.collection<CalendarRow>("calendar_events").insertOne({
      id,
      userId,
      title,
      eventDate,
      note: body.note ?? null,
      createdAt,
    });

    return Response.json({
      id,
      title,
      eventDate,
      note: body.note ?? null,
      createdAt,
    });
  });
}
