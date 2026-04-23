"use client";

import { useEffect, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";

type Task = {
  id: number;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
};

export default function TasksPage() {
  const { palette, mode } = useTrackTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    void fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  async function addTask() {
    if (!title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority, dueDate: dueDate || null }),
    });
    setTitle("");
    setDueDate("");
    const data = (await fetch("/api/tasks").then((res) => res.json())) as Task[];
    setTasks(data);
  }

  async function toggleTask(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !task.done }),
    });
    const data = (await fetch("/api/tasks").then((res) => res.json())) as Task[];
    setTasks(data);
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const data = (await fetch("/api/tasks").then((res) => res.json())) as Task[];
    setTasks(data);
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-3 rounded-xl p-4 sm:flex-row" style={{ background: palette.cardBg }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 rounded-md px-3 py-2 outline-none"
          style={{ background: palette.innerBg, color: palette.text }}
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-md px-3 py-2"
          style={{ background: palette.innerBg, color: palette.text }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
          className="rounded-md px-3 py-2"
          style={{ background: palette.innerBg, color: palette.text }}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={addTask} className="rounded-md px-4 py-2 hover:opacity-90" style={{ background: palette.accent }}>
          Add
        </button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between rounded-xl p-4" style={{ background: palette.cardBg }}>
            <div>
              <p className={task.done ? "line-through opacity-70" : ""}>{task.title}</p>
              <p className="text-xs opacity-70">Priority: {task.priority}</p>
              {task.dueDate && <p className="text-xs opacity-70">Due: {task.dueDate}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleTask(task)} className="rounded-md px-3 py-1" style={{ background: palette.innerBg }}>
                {task.done ? "Undo" : "Done"}
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="rounded-md px-3 py-1"
                style={{ background: mode === "dark" ? "#8b2b2b" : "#cc7f6f" }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="opacity-75">No tasks yet. Add your first one.</p>}
      </div>
    </AppShell>
  );
}
