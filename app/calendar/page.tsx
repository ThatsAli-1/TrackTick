"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell, useTrackTheme } from "@/app/components/app-shell";
import type { CalendarEvent, Task } from "@/lib/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export default function CalendarPage() {
  const { palette } = useTrackTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
  const gridRowCount = Math.ceil((firstDayWeekIdx + daysInMonth) / 7);

  const selectedTasks = tasks.filter((task) => task.dueDate === selectedDate);
  const selectedEvents = events.filter((event) => event.eventDate === selectedDate);

  return (
    <AppShell>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-3">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="rounded-lg px-3 py-2 text-sm sm:text-base"
            style={{ background: palette.accent }}
          >
            &lt; Prev
          </button>
          <p className="truncate text-center text-base sm:text-xl">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setMonthDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="rounded-lg px-3 py-2 text-sm sm:text-base"
            style={{ background: palette.accent }}
          >
            Next &gt;
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4">
          <div
            className="flex min-h-[11rem] flex-[1.4] flex-col overflow-hidden rounded-xl p-2 sm:min-h-0 sm:flex-1 sm:p-3"
            style={{ background: palette.cardBg }}
          >
            <div className="mb-1 grid shrink-0 grid-cols-7 gap-0.5 text-center text-[10px] sm:gap-1 sm:text-xs">
              {WEEKDAYS.map((d) => (
                <p key={d} className="truncate">
                  {d}
                </p>
              ))}
            </div>
            <div
              className="grid min-h-0 flex-1 grid-cols-7 gap-0.5 sm:gap-1"
              style={{
                gridTemplateRows: `repeat(${gridRowCount}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="min-h-0 min-w-0 rounded-md" />;
                }
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
                    className="flex min-h-0 min-w-0 flex-col rounded-md border p-0.5 text-left sm:p-1.5"
                    style={{
                      borderColor: isSelected ? palette.progressFill : palette.border,
                      background: isSelected ? palette.accent : palette.innerBg,
                    }}
                  >
                    <p className="text-[10px] leading-none sm:text-xs">{date.getDate()}</p>
                    <div className="mt-auto flex flex-wrap gap-0.5 pt-0.5">
                      {dots.slice(0, 3).map((dot, i) => (
                        <span key={`${ymd}-dot-${i}`} className="h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2" style={{ background: dot }} />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex min-h-0 w-full shrink-0 flex-col gap-2 overflow-hidden lg:flex lg:max-w-sm lg:flex-1 lg:gap-3">
            <div
              className="grid shrink-0 grid-cols-2 gap-2 rounded-xl p-2 sm:grid-cols-4 lg:grid-cols-2 lg:p-3"
              style={{ background: palette.cardBg }}
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none sm:col-span-1 lg:col-span-2"
                style={{ background: palette.innerBg, color: palette.text }}
              />
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="rounded-md px-2 py-1.5 text-sm"
                style={{ background: palette.innerBg, color: palette.text }}
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note"
                className="col-span-2 rounded-md px-2 py-1.5 text-sm outline-none lg:col-span-2"
                style={{ background: palette.innerBg, color: palette.text }}
              />
              <button
                type="button"
                onClick={() => void addEvent()}
                className="col-span-2 rounded-md px-3 py-1.5 text-sm hover:opacity-90 lg:col-span-2"
                style={{ background: palette.accent }}
              >
                Save Event
              </button>
            </div>

            <div
              className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-xl p-2 sm:p-3"
              style={{ background: palette.cardBg }}
            >
              <p className="shrink-0 text-sm font-medium sm:text-base">{selectedDate}</p>
              <div className="min-h-0 flex-1 space-y-2 overflow-hidden">
                {selectedTasks.map((task) => (
                  <div key={`task-${task.id}`} className="shrink-0 rounded-lg px-2 py-1.5" style={{ background: palette.innerBg }}>
                    <p className="truncate text-sm font-medium sm:text-base">{task.title}</p>
                    <p className="truncate text-xs opacity-80">
                      {task.done ? "Done" : "Open"} • {task.priority}
                    </p>
                  </div>
                ))}
                {selectedEvents.map((event) => (
                  <div key={event.id} className="shrink-0 rounded-lg px-2 py-1.5" style={{ background: palette.innerBg }}>
                    <p className="truncate text-sm font-medium sm:text-base">{event.title}</p>
                    {event.note ? (
                      <p className="line-clamp-2 text-xs opacity-90">{event.note}</p>
                    ) : null}
                  </div>
                ))}
                {selectedTasks.length === 0 && selectedEvents.length === 0 ? (
                  <p className="text-sm opacity-75">Nothing on this date.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
