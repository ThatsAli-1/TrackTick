"use client";

import { useEffect, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";
import Link from "next/link";
import type { ProgressSummary, TaskListItem } from "@/lib/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("tracktick-dashboard-notes") ?? "";
  });
  const { palette } = useTrackTheme();

  async function refreshData() {
    const [summaryRes, tasksRes] = await Promise.all([
      fetch("/api/progress/summary"),
      fetch("/api/tasks"),
    ]);
    setSummary((await summaryRes.json()) as ProgressSummary);
    setTasks((await tasksRes.json()) as TaskListItem[]);
  }

  useEffect(() => {
    void fetch("/api/progress/summary")
      .then((res) => res.json())
      .then((data) => setSummary(data as ProgressSummary));
    void fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data as TaskListItem[]));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("tracktick-dashboard-notes", notes);
  }, [notes]);

  async function addTaskFromDashboard() {
    if (!newTaskTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTaskTitle.trim(),
        priority: "medium",
        dueDate: newTaskDueDate || null,
      }),
    });
    setNewTaskTitle("");
    setNewTaskDueDate("");
    await refreshData();
  }

  const today = new Date().toISOString().slice(0, 10);
  const todaysTasks = tasks.filter((task) => task.dueDate === today);

  return (
    <AppShell>
      <h1 className="text-5xl">Good evening User</h1>
      <p className="mt-2 text-lg" style={{ color: palette.mutedText }}>
        Ready to focus ?
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Pomodoros" value={summary?.focusSessions ?? 0} />
        <StatCard label="Month Tasks Finished" value={`${summary?.tasksCompleted ?? 0}/${summary?.tasksTotal ?? 0}`} />
        <StatCard label="Focus Time Today" value={`${summary?.focusMinutes ?? 0}m`} />
        <StatCard label="Focus Streak" value="3 Days" />
      </div>

      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-4xl">Today&apos;s Tasks</h2>
          <div className="space-y-3">
            {todaysTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="rounded-xl p-3" style={{ background: palette.cardBg }}>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{task.title}</span>
                  <span>{task.done ? "100%" : "0%"}</span>
                </div>
                {task.dueDate && (
                  <p className="mb-2 text-xs" style={{ color: palette.mutedText }}>
                    Due: {task.dueDate}
                  </p>
                )}
                <div className="h-2 rounded-full" style={{ background: palette.progressTrack }}>
                  <div className="h-2 rounded-full" style={{ width: task.done ? "100%" : "20%", background: palette.progressFill }} />
                </div>
              </div>
            ))}
            {todaysTasks.length === 0 && (
              <p className="text-sm" style={{ color: palette.mutedText }}>
                No tasks due today.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: palette.cardBg, color: palette.text }}
              />
              <input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: palette.cardBg, color: palette.text }}
              />
            </div>
            <button
              type="button"
              onClick={() => void addTaskFromDashboard()}
              className="rounded-lg px-5 py-2 text-sm"
              style={{ background: palette.accent }}
            >
              Add Task
            </button>
            <Link href="/tasks" className="inline-block rounded-lg px-5 py-2 text-sm" style={{ background: palette.accent }}>
              Open Tasks List
            </Link>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-4xl">Notes</h2>
          <div className="h-[310px] rounded-3xl p-3" style={{ background: palette.cardBg }}>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your notes here..."
              className="h-full w-full resize-none rounded-2xl p-3 outline-none"
              style={{ background: palette.innerBg, color: palette.text }}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  const { palette } = useTrackTheme();
  return (
    <div className="rounded-3xl px-4 py-4 text-center" style={{ background: palette.cardBg }}>
      <p className="text-sm" style={{ color: palette.mutedText }}>
        {label}
      </p>
      <p className="mt-1 text-4xl">{value}</p>
    </div>
  );
}
