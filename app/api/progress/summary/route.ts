import { connectMongo, getDb } from "@/lib/mongo";

export async function GET() {
  await connectMongo();
  const db = getDb();

  const [taskTotal, taskCompleted] = await Promise.all([
    db.collection("tasks").countDocuments(),
    db.collection("tasks").countDocuments({ done: true }),
  ]);

  const focusAgg = await db
    .collection("pomodoro_sessions")
    .aggregate<{ sessions: number; totalSeconds: number }>([
      { $match: { mode: "focus" } },
      {
        $group: {
          _id: null,
          sessions: { $sum: 1 },
          totalSeconds: { $sum: "$durationSeconds" },
        },
      },
    ])
    .toArray();

  const focusStats = focusAgg[0] ?? { sessions: 0, totalSeconds: 0 };

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = await db.collection("calendar_events").countDocuments({
    eventDate: { $gte: today },
  });

  return Response.json({
    tasksTotal: taskTotal,
    tasksCompleted: taskCompleted,
    focusSessions: focusStats.sessions,
    focusMinutes: Math.floor(focusStats.totalSeconds / 60),
    upcomingEvents,
  });
}
