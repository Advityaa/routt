"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface ChecklistProps {
  items: string[];
  /**
   * Changing this key re-mounts rows so the fade-rise stagger replays — used
   * by the hero when the selected destination changes.
   */
  replayKey?: string | number;
  /** Optional heading rendered above the rows. */
  title?: string;
}

/**
 * A list of first-trip to-dos. Rows fade-rise in sequence and can be ticked
 * off. Used both in the landing hero (live-updating) and inside playbooks.
 */
export default function Checklist({ items, replayKey, title }: ChecklistProps) {
  const [done, setDone] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="not-prose">
      {title ? (
        <p className="mb-3 font-body text-sm font-semibold uppercase tracking-wider text-primary/70">
          {title}
        </p>
      ) : null}
      <ul key={replayKey} className="flex flex-col gap-2.5">
        {items.map((item, i) => {
          const checked = done.has(i);
          return (
            <li
              key={`${replayKey}-${i}`}
              className="animate-fade-rise"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={checked}
                className="flex w-full items-center gap-3 rounded-2xl border border-hairline bg-white px-4 py-3 text-left shadow-soft transition-colors hover:border-primary/40"
              >
                <span
                  aria-hidden
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    checked
                      ? "border-primary bg-primary text-white"
                      : "border-hairline bg-fill/50 text-transparent"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span
                  className={`font-body text-sm transition-colors ${
                    checked ? "text-ink/40 line-through" : "text-ink"
                  }`}
                >
                  {item}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
