"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";

type CalendarEvent = {
  id: number;
  title: string;
  eventDate: string;
  note: string | null;
  createdAt: string;
};

type TaskItem = {
  id: number;
  title: string;
  done: boolean;
  dueDate: string | null;
  priority: "low" | "medium" | "high";
};

export default function CalendarPage() {
  const { palette } = useTrackTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  useEffect(() => {
    void fetch("/api/calendar/events")
      .then((res) => res.json())
      .then((data) => setEvents(data));
    void fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => setTasks(data));
  }, []);

  async function addEvent() {
    if (!title.trim() || !eventDate) return;
    await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, eventDate, note }),
    });
    setTitle("");
    setEventDate("");
    setNote("");
    const data = (await fetch("/api/calendar/events").then((res) => res.json())) as CalendarEvent[];
    setEvents(data);
  }

  const dateDots = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const event of events) {
      const dots = map.get(event.eventDate) ?? [];
      dots.push("#60a5fa");
      map.set(event.eventDate, dots);
    }
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const dots = map.get(task.dueDate) ?? [];
      const color = task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#14b8a6";
      dots.push(color);
      map.set(task.dueDate, dots);
    }
    return map;
  }, [events, tasks]);

  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDayWeekIdx = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDayWeekIdx + daysInMonth }, (_, idx) => {
    if (idx < firstDayWeekIdx) return null;
    const day = idx - firstDayWeekIdx + 1;
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
  });

  const selectedTasks = tasks.filter((task) => task.dueDate === selectedDate);
  const selectedEvents = events.filter((event) => event.eventDate === selectedDate);

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
          }
          className="rounded-lg px-3 py-2"
          style={{ background: palette.accent }}
        >
          &lt; Prev
        </button>
        <p className="text-xl">{monthLabel}</p>
        <button
          type="button"
          onClick={() =>
            setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
          }
          className="rounded-lg px-3 py-2"
          style={{ background: palette.accent }}
        >
          Next &gt;
        </button>
      </div>

      <div className="mb-6 rounded-xl p-4" style={{ background: palette.cardBg }}>
        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs sm:text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <p key={d}>{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="h-20 rounded-lg" />;
            const ymd = date.toISOString().slice(0, 10);
            const isSelected = ymd === selectedDate;
            const dots = dateDots.get(ymd) ?? [];
            return (
              <button
                type="button"
                key={ymd}
                onClick={() => {
                  setSelectedDate(ymd);
                  setEventDate(ymd);
                }}
                className="h-20 rounded-lg border p-2 text-left"
                style={{
                  borderColor: isSelected ? palette.progressFill : palette.border,
                  background: isSelected ? palette.accent : palette.innerBg,
                }}
              >
                <p className="text-xs">{date.getDate()}</p>
                <div className="mt-2 flex gap-1">
                  {dots.slice(0, 3).map((dot, i) => (
                    <span key={`${ymd}-dot-${i}`} className="h-2 w-2 rounded-full" style={{ background: dot }} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-xl p-4 sm:grid-cols-4" style={{ background: palette.cardBg }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          className="rounded-md px-3 py-2 outline-none"
          style={{ background: palette.innerBg, color: palette.text }}
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="rounded-md px-3 py-2"
          style={{ background: palette.innerBg, color: palette.text }}
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="rounded-md px-3 py-2 outline-none"
          style={{ background: palette.innerBg, color: palette.text }}
        />
        <button
          onClick={addEvent}
          className="rounded-md px-4 py-2 hover:opacity-90"
          style={{ background: palette.accent }}
        >
          Save Event
        </button>
      </div>

      <div className="space-y-3">
        <p className="text-lg">Selected Date: {selectedDate}</p>
        {selectedTasks
          .map((task) => (
            <div key={`task-${task.id}`} className="rounded-xl p-4" style={{ background: palette.cardBg }}>
              <p className="text-xl">{task.title}</p>
              <p className="text-sm opacity-80">Task date: {task.dueDate}</p>
              <p className="mt-1 text-xs opacity-80">
                {task.done ? "Completed" : "Pending"} • Priority: {task.priority}
              </p>
            </div>
          ))}
        {selectedEvents.map((event) => (
          <div key={event.id} className="rounded-xl p-4" style={{ background: palette.cardBg }}>
            <p className="text-xl">{event.title}</p>
            <p className="text-sm opacity-80">{event.eventDate}</p>
            {event.note && <p className="mt-1 text-sm opacity-90">{event.note}</p>}
          </div>
        ))}
        {selectedTasks.length === 0 && selectedEvents.length === 0 && (
          <p className="opacity-75">No tasks or events on this date.</p>
        )}
      </div>
    </AppShell>
  );
}
