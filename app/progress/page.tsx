"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";

type Summary = {
  tasksTotal: number;
  tasksCompleted: number;
  focusSessions: number;
  focusMinutes: number;
  upcomingEvents: number;
};

export default function ProgressPage() {
  const { palette } = useTrackTheme();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/progress/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data));
  }, []);

  const completionRate = useMemo(() => {
    if (!summary || summary.tasksTotal === 0) return 0;
    return Math.round((summary.tasksCompleted / summary.tasksTotal) * 100);
  }, [summary]);

  return (
    <AppShell>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Task Completion" palette={palette}>
          <p className="text-4xl">{completionRate}%</p>
          <p className="text-sm opacity-80">
            {summary?.tasksCompleted ?? 0} of {summary?.tasksTotal ?? 0} tasks completed
          </p>
        </Card>
        <Card title="Focus Time" palette={palette}>
          <p className="text-4xl">{summary?.focusMinutes ?? 0} min</p>
          <p className="text-sm opacity-80">{summary?.focusSessions ?? 0} completed sessions</p>
        </Card>
        <Card title="Upcoming Events" palette={palette}>
          <p className="text-4xl">{summary?.upcomingEvents ?? 0}</p>
          <p className="text-sm opacity-80">Events scheduled from today onward</p>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  children,
  palette,
}: {
  title: string;
  children: React.ReactNode;
  palette: {
    cardBg: string;
    border: string;
  };
}) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: palette.border, background: palette.cardBg }}>
      <p className="mb-3 text-lg">{title}</p>
      {children}
    </div>
  );
}
