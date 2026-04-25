/** Shared API / UI shapes used across pages */

export type Task = {
  id: number;
  title: string;
  done: boolean;
  priority: "low" | "medium" | "high";
  dueDate: string | null;
  createdAt: string;
};

export type TaskListItem = Pick<Task, "id" | "title" | "done" | "dueDate">;

export type ProgressSummary = {
  tasksTotal: number;
  tasksCompleted: number;
  focusSessions: number;
  focusMinutes: number;
  upcomingEvents: number;
};

export type CalendarEvent = {
  id: number;
  title: string;
  eventDate: string;
  note: string | null;
  createdAt: string;
};

export type PomodoroSession = {
  id: number;
  mode: string;
  durationSeconds: number;
  completedAt: string;
};
