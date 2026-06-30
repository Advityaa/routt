"use client";

import { Check } from "lucide-react";
import Icon, { categoryIcon } from "@/components/Icon";
import { taskState, URGENCY_ORDER, type UrgencyState } from "@/lib/countdown";
import type { TripTask } from "@/lib/trip-types";

const BADGE_LABEL: Record<UrgencyState, string> = {
  overdue: "DO NOW",
  "do-now": "DO NOW",
  "coming-up": "SOON",
  later: "LATER",
  done: "DONE",
};

/**
 * The countdown tile — real per-destination tasks run through the urgency
 * engine, in the dark canvas style. Rows are checkable (real progress).
 */
export default function CountdownTile({
  tasks,
  days,
  done,
  onToggle,
}: {
  tasks: TripTask[];
  days: number;
  done: Set<string>;
  onToggle: (taskId: string) => void;
}) {
  const sorted = [...tasks].sort((a, b) => {
    const sa = URGENCY_ORDER.indexOf(taskState(a, days, done.has(a.id)));
    const sb = URGENCY_ORDER.indexOf(taskState(b, days, done.has(b.id)));
    return sa - sb || b.leadTimeDays - a.leadTimeDays;
  });
  const doneCount = tasks.filter((t) => done.has(t.id)).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="canvas-tile flex h-full flex-col p-6">
      <p className="canvas-label">Your countdown · {doneCount} of {tasks.length} done</p>

      <div className="mt-3 flex-1">
        {sorted.map((task) => {
          const state = taskState(task, days, done.has(task.id));
          const isDone = state === "done";
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => onToggle(task.id)}
              className="flex w-full items-center gap-3.5 border-b border-white/10 py-3 text-left last:border-0"
            >
              <span
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg ${
                  isDone ? "bg-skyaccent text-canvasbg" : "bg-skyaccent/20 text-skyaccent"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Icon name={categoryIcon(task.category)} className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-body text-[0.95rem] font-medium ${isDone ? "text-white/40 line-through" : "text-white"}`}>
                  {task.title}
                </span>
                <span className="block truncate font-body text-[0.78rem] text-canvasmuted">{task.why}</span>
              </span>
              {!isDone ? <span className="canvas-badge shrink-0">{BADGE_LABEL[state]}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-pill bg-white/10">
        <div
          className="h-full rounded-pill bg-gradient-to-r from-primary to-skyaccent transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
