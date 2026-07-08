"use client";

import { useEffect, useState } from "react";
import type { Event, EventType } from "@/lib/types";
import { getEventsThisWeek } from "@/lib/dataProvider";
import EventItem from "@/components/EventItem";

const BANGKOK_DEFAULT = { lat: 13.7376, lng: 100.5602 };
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TYPE_LABEL: Record<EventType, string> = {
  music: "Live music",
  market: "Market",
  art: "Art",
  food: "Food",
  sport: "Sport",
  nightlife: "Nightlife",
  culture: "Culture",
};

/** Parse an event's Bangkok wall-clock without timezone conversion. */
function parseWhen(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return { key: iso, dow: 0, day: "", date: 0, time: "" };
  const [, y, mo, d, hh, mm] = m;
  const dow = new Date(Date.UTC(+y, +mo - 1, +d)).getUTCDay();
  return { key: `${y}-${mo}-${d}`, dow, day: DOW[dow], date: +d, time: `${hh}:${mm}` };
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    let alive = true;
    getEventsThisWeek(BANGKOK_DEFAULT).then((res) => {
      if (alive) setEvents(res);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Group by day, preserving date order.
  const groups: { key: string; label: string; items: Event[] }[] = [];
  for (const ev of events) {
    const w = parseWhen(ev.dateISO);
    const label = `${DOW_LONG[w.dow]} ${w.date}`;
    let g = groups.find((x) => x.key === w.key);
    if (!g) {
      g = { key: w.key, label, items: [] };
      groups.push(g);
    }
    g.items.push(ev);
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas px-5 pb-28 pt-9">
      <header>
        <div className="text-eyebrow uppercase text-muted">Bangkok · this week</div>
        <h1 className="mt-1.5 font-display text-display font-semibold tracking-tight text-fg">
          On this week
        </h1>
        <p className="mt-1 text-[14px] text-muted">What&apos;s actually on near you, soonest first.</p>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.key}>
            <h2 className="text-eyebrow uppercase text-muted">{group.label}</h2>
            <div className="mt-2.5 flex flex-col gap-3">
              {group.items.map((ev) => {
                const w = parseWhen(ev.dateISO);
                return (
                  <a
                    key={ev.id}
                    href={ev.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <EventItem
                      day={w.day}
                      date={String(w.date).padStart(2, "0")}
                      name={ev.name}
                      venue={ev.venue}
                      when={w.time}
                      tag={TYPE_LABEL[ev.type]}
                    />
                  </a>
                );
              })}
            </div>
          </section>
        ))}

        {events.length === 0 ? (
          <p className="py-8 text-center font-mono text-[12px] text-muted">
            Nothing on the radar this week.
          </p>
        ) : null}
      </div>
    </main>
  );
}
