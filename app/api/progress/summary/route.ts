import db from "@/lib/db";

export async function GET() {
  const taskStats = db
    .prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) as completed FROM tasks",
    )
    .get() as {
    total: number;
    completed: number | null;
  };

  const focusStats = db
    .prepare(
      "SELECT COUNT(*) as sessions, COALESCE(SUM(durationSeconds), 0) as totalSeconds FROM pomodoro_sessions WHERE mode = 'focus'",
    )
    .get() as {
    sessions: number;
    totalSeconds: number;
  };

  const upcoming = db
    .prepare("SELECT COUNT(*) as total FROM calendar_events WHERE eventDate >= date('now')")
    .get() as { total: number };

  return Response.json({
    tasksTotal: taskStats.total,
    tasksCompleted: taskStats.completed ?? 0,
    focusSessions: focusStats.sessions,
    focusMinutes: Math.floor(focusStats.totalSeconds / 60),
    upcomingEvents: upcoming.total,
  });
}
