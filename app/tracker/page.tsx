"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";

type Task = {
  id: number;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
};

export default function TrackerPage() {
  const { palette } = useTrackTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [monthIndex, setMonthIndex] = useState(3);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    void fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((task) => task.priority === filter)),
    [tasks, filter],
  );

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl p-4" style={{ background: palette.cardBg }}>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {["Sun", "Sat", "Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
            {Array.from({ length: 30 }).map((_, idx) => (
              <div key={idx} className="rounded-lg border p-3 text-left" style={{ borderColor: palette.border }}>
                <p className="text-xs">{idx + 1}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-center gap-14 text-sm">
            <button
              type="button"
              onClick={() => setMonthIndex((m) => (m + 11) % 12)}
              className="rounded px-2 py-1"
              style={{ background: palette.accent }}
            >
              &lt;{monthNames[(monthIndex + 11) % 12]}
            </button>
            <span>{monthNames[monthIndex]}</span>
            <button
              type="button"
              onClick={() => setMonthIndex((m) => (m + 1) % 12)}
              className="rounded px-2 py-1"
              style={{ background: palette.accent }}
            >
              {monthNames[(monthIndex + 1) % 12]}&gt;
            </button>
          </div>
        </section>

        <section className="rounded-3xl p-6" style={{ background: palette.cardBg }}>
          <p className="mb-3 text-3xl">Tasks</p>
          <div className="mb-4 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: palette.accent }}>
            <span>Filter By Priority</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFilter("high")} className="h-4 w-4 rounded-full bg-red-500" />
              <button type="button" onClick={() => setFilter("medium")} className="h-4 w-4 rounded-full bg-yellow-400" />
              <button type="button" onClick={() => setFilter("low")} className="h-4 w-4 rounded-full bg-teal-500" />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-xl p-3" style={{ background: palette.accent }}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{task.title}</span>
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{
                      background:
                        task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#facc15" : "#14b8a6",
                    }}
                  />
                </div>
                <div className="h-2 rounded-full" style={{ background: palette.progressFill }}>
                  <div className="h-2 rounded-full" style={{ width: task.done ? "100%" : "10%", background: palette.progressTrack }} />
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-sm">No tasks available for this filter.</p>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
