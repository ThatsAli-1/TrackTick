import { getSessionUserId } from "@/lib/auth-session";
import { withDb } from "@/lib/mongo";

export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return Response.json({
      tasksTotal: 0,
      tasksCompleted: 0,
      focusSessions: 0,
      focusMinutes: 0,
      upcomingEvents: 0,
    });
  }

  return withDb(async (db) => {
    const [taskTotal, taskCompleted] = await Promise.all([
      db.collection("tasks").countDocuments({ userId }),
      db.collection("tasks").countDocuments({ userId, done: true }),
    ]);

    const focusAgg = await db
      .collection("pomodoro_sessions")
      .aggregate<{ sessions: number; totalSeconds: number }>([
        { $match: { mode: "focus", userId } },
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
      userId,
      eventDate: { $gte: today },
    });

    return Response.json({
      tasksTotal: taskTotal,
      tasksCompleted: taskCompleted,
      focusSessions: focusStats.sessions,
      focusMinutes: Math.floor(focusStats.totalSeconds / 60),
      upcomingEvents,
    });
  });
}
