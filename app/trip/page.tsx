"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Plane } from "lucide-react";
import { getTrip, setTrip, type Trip } from "@/lib/trip";
import { generatePacking, ACTIVITIES, type TripWeather } from "@/lib/packing";
import type { Category, CredibilityResult, Place } from "@/lib/types";
import { resolvePastedPlace, getSavedPlaces } from "@/lib/dataProvider";
import { getSaved, savePlace, addUnverified, removeSaved, type SavedItem } from "@/lib/savedTrip";
import VerdictBadge from "@/components/VerdictBadge";
import SavedPlaceTag, { tagRotation } from "@/components/SavedPlaceTag";

const CATEGORY_LABEL: Record<Category, string> = { eat: "Eat", drink: "Drink", shop: "Shop", see: "See" };

type Summary = { place: Place; credibility: CredibilityResult };

function toastForMatch(name: string, verdict: CredibilityResult["verdict"]): string {
  if (verdict === "tourist-trap") return `Saved — but careful: ${name} reads as a Tourist trap.`;
  if (verdict === "fading") return `Saved — heads up, ${name} is rated Fading.`;
  if (verdict === "unrated") return `Saved. Not enough reviews yet to call ${name}.`;
  return `Saved. Locals still rate ${name} — good call.`;
}

function NeutralBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line px-2.5 py-1 font-display text-[13px] font-semibold text-muted">
      <span className="text-faint">?</span> Not enough data yet
    </span>
  );
}

export default function TripPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [summaries, setSummaries] = useState<Record<string, Summary>>({});
  const [input, setInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function reload() {
    const saved = getSaved();
    setItems(saved);
    const placeIds = saved.filter((i) => i.kind === "place").map((i) => i.id);
    const found = await getSavedPlaces(placeIds);
    const map: Record<string, Summary> = {};
    for (const s of found) map[s.place.id] = s;
    setSummaries(map);
  }

  useEffect(() => {
    reload();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4200);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    const result = await resolvePastedPlace(value);
    if (result.status === "matched") {
      savePlace(result.place.id);
      showToast(toastForMatch(result.place.name, result.credibility.verdict));
    } else {
      addUnverified(result.name, result.sourceUrl);
      showToast("Saved. Not enough data to verify this one yet.");
    }
    setInput("");
    await reload();
  }

  const [undoItem, setUndoItem] = useState<SavedItem | null>(null);
  function onRemove(id: string) {
    const item = items.find((x) => x.id === id) ?? null;
    removeSaved(id);
    setUndoItem(item);
    if (item) showToast(`Removed ${item.kind === "place" ? summaries[item.id]?.place.name ?? "place" : item.name} — tap Undo below`);
    reload();
  }
  function undoRemove() {
    if (!undoItem) return;
    if (undoItem.kind === "place") savePlace(undoItem.id);
    else addUnverified(undoItem.name, undoItem.sourceUrl);
    setUndoItem(null);
    setToast(null);
    reload();
  }

  return (
    <main className="w-full min-h-[100dvh] bg-canvas px-5 pb-28 pt-9">
      <Link href="/" className="inline-block font-mono text-[12.5px] text-muted transition hover:text-fg">
        ← Back
      </Link>

      <h1 className="mt-5 font-display text-display font-semibold tracking-tight text-fg">Your trip</h1>
      <p className="mt-1 text-[14px] text-muted">
        Saved places — each still carries its credibility verdict.
      </p>

      {/* Paste a link — the key feature */}
      <form onSubmit={onSubmit} className="mt-5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste an Instagram / TikTok / Maps link or place name"
          aria-label="Paste a link or place name"
          className="min-w-0 flex-1 rounded-pill border border-line bg-surface px-4 py-[13px] font-sans text-[12.5px] text-fg placeholder:text-muted focus:border-fg/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="shrink-0 rounded-pill bg-fg px-[22px] py-[13px] font-sans text-[13.5px] font-semibold text-canvas transition hover:opacity-90 disabled:bg-elevate disabled:text-faint"
        >
          Save
        </button>
      </form>

      {/* Add your flight — auto-derives the trip (destination + dates) */}
      <FlightSetup />

      <PackingList />

      {/* Post-trip prompt — the highest-intent moment to capture a real report */}
      {process.env.NEXT_PUBLIC_DATA_MODE === "db" &&
      items.some((i) => i.kind === "place" && summaries[i.id]) ? (
        (() => {
          const first = items.find((i) => i.kind === "place" && summaries[i.id])!;
          const p = summaries[first.id].place;
          return (
            <Link
              href={`/place/${p.id}`}
              className="mt-5 block rounded-card border border-line bg-elevate px-4 py-3 text-[13.5px] text-fg transition hover:border-fg/25"
            >
              Been to <span className="font-semibold">{p.name}</span>? Tell travellers how it was →
            </Link>
          );
        })()
      ) : null}

      {/* Section label + luggage-tag list (handoff motif: collect) */}
      <p className="pb-1 pt-[30px] font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">
        {items.length === 0 ? "Nothing tagged yet" : `${items.length} place${items.length === 1 ? "" : "s"} saved`}
      </p>

      {items.length === 0 ? (
        <div className="mt-3.5 flex border-[1.5px] border-dashed border-line" style={{ borderRadius: "4px 16px 16px 4px" }}>
          <div className="flex w-[56px] shrink-0 flex-col items-center justify-center border-r-[1.5px] border-dashed border-line py-6">
            <span className="h-[13px] w-[13px] rounded-full border-2 border-line" aria-hidden />
          </div>
          <div className="flex-1 px-4 py-6">
            <p className="font-display text-[17px] font-medium text-muted">No tags on this trip yet.</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              Paste a reel or Maps link above — we&apos;ll tell you straight away if it&apos;s actually worth it.
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-3.5">
          {items.map((item, i) => {
            const summary = item.kind === "place" ? summaries[item.id] : undefined;
            let rot = tagRotation(item.id);
            if (i > 0 && Math.abs(rot - tagRotation(items[i - 1].id)) < 0.25) rot += rot >= 0 ? -1 : 1; // no twin neighbours
            return (
              <SavedPlaceTag
                key={item.id}
                code={`RT · ${String(i + 1).padStart(2, "0")}`}
                category={summary ? CATEGORY_LABEL[summary.place.category] : "Pasted"}
                neighborhood={summary?.place.neighborhood || undefined}
                title={summary ? summary.place.name : item.kind === "unverified" ? item.name : "Saved place"}
                verdict={summary ? summary.credibility.verdict : "unrated"}
                rotation={rot}
                delayMs={100 + i * 120}
                href={summary ? `/place/${item.id}` : undefined}
                onRemove={() => onRemove(item.id)}
              />
            );
          })}
        </div>
      )}

      {/* Toast */}
      {toast ? (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-5">
          <div className="animate-rise flex max-w-[92%] items-center gap-3 rounded-pill border border-line bg-elevate px-4 py-2.5 text-center font-sans text-[13px] text-fg shadow-card">
            <span className="min-w-0 truncate">{toast}</span>
            {undoItem ? (
              <button onClick={undoRemove} className="shrink-0 font-semibold underline underline-offset-2">Undo</button>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function FlightSetup() {
  const [trip, setTripState] = useState<Trip | null>(null);
  const [num, setNum] = useState(""); const [date, setDate] = useState("");
  const [manual, setManual] = useState(false); const [dest, setDest] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => setTripState(getTrip()), []);
  async function lookup() {
    if (!num.trim() || !date) return;
    setBusy(true); setMsg("");
    const r = await fetch(`/api/flight?number=${encodeURIComponent(num)}&date=${date}`);
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(d.error ?? "lookup failed"); setManual(true); return; }
    const t: Trip = { destination: d.destination ?? d.dest ?? "your destination", startISO: date,
      flight: { number: num.toUpperCase(), date, origin: d.origin, dest: d.dest, depTime: d.depTime, arrTime: d.arrTime, source: d.source } };
    setTrip(t); setTripState(t);
  }
  function saveManual() {
    if (!dest.trim() || !date) return;
    const t: Trip = { destination: dest.trim(), startISO: date };
    setTrip(t); setTripState(t);
  }
  if (trip) {
    const days = Math.ceil((Date.parse(trip.startISO) - Date.now()) / 86_400_000);
    return (
      <div className="mt-5 rounded-card border border-line bg-surface p-4" data-testid="trip-config">
        <div className="text-eyebrow uppercase text-muted">Your trip</div>
        <p className="mt-1.5 text-[14.5px] text-fg">
          <span className="font-semibold">{trip.destination}</span>
          {days > 0 ? ` · in ${days} day${days === 1 ? "" : "s"}` : days === 0 ? " · today" : ""}
          {trip.flight ? ` · ${trip.flight.number}` : ""}
        </p>
        {trip.flight?.source ? (
          <p className="mt-1 font-mono text-[10.5px] text-faint">
            Times via {trip.flight.source} — estimates only, verify with your airline.
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="mt-5 rounded-card border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-eyebrow uppercase text-muted"><Plane size={13} /> Add your flight</div>
      <div className="mt-2.5 flex gap-2">
        <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Flight no. e.g. TG317"
          className="h-10 min-w-0 flex-1 rounded-pill border border-line bg-elevate px-3.5 text-[13.5px] text-fg placeholder:text-faint focus:outline-none" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Flight date"
          className="h-10 w-[132px] rounded-pill border border-line bg-elevate px-3 text-[13px] text-fg focus:outline-none" />
      </div>
      {manual ? (
        <div className="mt-2 flex gap-2">
          <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="Destination city"
            className="h-10 min-w-0 flex-1 rounded-pill border border-line bg-elevate px-3.5 text-[13.5px] text-fg placeholder:text-faint focus:outline-none" />
          <button onClick={saveManual} className="h-10 shrink-0 rounded-pill bg-accent px-4 text-[13px] font-semibold text-accent-ink">Set trip</button>
        </div>
      ) : (
        <button onClick={lookup} disabled={busy || !num.trim() || !date}
          className="mt-2 h-10 rounded-pill bg-accent px-4 text-[13px] font-semibold text-accent-ink disabled:bg-elevate disabled:text-faint">
          {busy ? "Looking up…" : "Auto-set my trip"}
        </button>
      )}
      {msg ? <p className="mt-2 text-[12px] text-muted">{msg} — set destination + date instead:</p> : null}
      <p className="mt-2 font-mono text-[10.5px] text-faint">Flight times are estimates — always verify with your airline.</p>
    </div>
  );
}

const CITY_LL: Record<string, { lat: number; lng: number }> = { bangkok: { lat: 13.7563, lng: 100.5018 }, dubai: { lat: 25.2, lng: 55.27 } };
function PackingList() {
  const [trip] = useState<Trip | null>(() => (typeof window === "undefined" ? null : getTrip()));
  const [w, setW] = useState<TripWeather | null>(null);
  const [acts, setActs] = useState<string[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setActs(JSON.parse(localStorage.getItem("routt.packActs") ?? "[]")); setDone(JSON.parse(localStorage.getItem("routt.packDone") ?? "{}")); } catch {}
    if (!trip) return;
    const ll = CITY_LL[trip.destination.toLowerCase()] ?? CITY_LL.bangkok;
    const end = trip.endISO ?? trip.startISO;
    fetch(`/api/tripweather?lat=${ll.lat}&lng=${ll.lng}&start=${trip.startISO}&end=${end}`).then((r) => (r.ok ? r.json() : null)).then((d) => d && setW(d)).catch(() => {});
  }, [trip]);
  if (!trip) return null;
  const nights = Math.max(1, Math.round((Date.parse(trip.endISO ?? trip.startISO) - Date.parse(trip.startISO)) / 86_400_000) || 3);
  const items = generatePacking(trip.destination, nights, w, acts);
  const toggleAct = (a: string) => { const n = acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a]; setActs(n); localStorage.setItem("routt.packActs", JSON.stringify(n)); };
  const toggle = (id: string) => { const n = { ...done, [id]: !done[id] }; setDone(n); localStorage.setItem("routt.packDone", JSON.stringify(n)); };
  const packed = items.filter((i) => done[i.id]).length;
  return (
    <section className="mt-5 rounded-card border border-line bg-surface p-4" data-testid="packing">
      <div className="text-eyebrow uppercase text-muted">Packing list · {packed}/{items.length} packed</div>
      {w ? (
        <p className="mt-1.5 text-[13px] text-muted" data-testid="packweather">
          {trip.destination}: {w.avgHighC}°/{w.avgLowC}°C, rain {w.rainDays}d · <span className="font-semibold">{w.mode === "forecast" ? "live forecast" : "typical for these dates"}</span>
        </p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {ACTIVITIES.map((a) => (
          <button key={a} onClick={() => toggleAct(a)} className={`h-8 rounded-pill border px-3 text-[12px] font-medium ${acts.includes(a) ? "border-accent bg-accent text-accent-ink" : "border-line text-muted"}`}>{a}</button>
        ))}
      </div>
      {(["Weather", "Activity", "Essentials"] as const).map((g) => {
        const gi = items.filter((i) => i.group === g);
        return gi.length ? (
          <div key={g} className="mt-3">
            <div className="text-eyebrow uppercase text-faint">{g}</div>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {gi.map((i) => (
                <li key={i.id}>
                  <label className="flex items-start gap-2.5 text-[13.5px]">
                    <input type="checkbox" checked={!!done[i.id]} onChange={() => toggle(i.id)} className="mt-0.5 accent-[var(--accent)]" />
                    <span className={done[i.id] ? "text-faint line-through" : "text-fg"}>{i.label} <span className="text-muted">— {i.reason}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ) : null;
      })}
    </section>
  );
}
