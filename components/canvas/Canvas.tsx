"use client";

import { useState } from "react";
import { MapPin, Calendar, Plus, Ticket } from "lucide-react";
import DestinationImage from "@/components/DestinationImage";
import BoardingPass from "@/components/canvas/BoardingPass";
import CountdownTile from "@/components/canvas/CountdownTile";
import ExperienceTile from "@/components/canvas/ExperienceTile";
import SavingsTile from "@/components/canvas/SavingsTile";
import PackingList from "@/components/canvas/PackingList";
import StampPassport from "@/components/canvas/StampPassport";
import WorldMap from "@/components/canvas/WorldMap";
import { daysUntilTrip } from "@/lib/countdown";
import { getTheme, themeVars } from "@/lib/theme";
import { cityCoords } from "@/lib/packing/data";
import type { TripDestination } from "@/lib/trip-types";
import { useCanvas } from "@/lib/canvas/store";

export interface CanvasDestination {
  slug: string;
  title: string;
  country: string;
}

function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${`${n.getMonth() + 1}`.padStart(2, "0")}-${`${n.getDate()}`.padStart(2, "0")}`;
}

export default function Canvas({
  destinations,
  taskData,
}: {
  destinations: CanvasDestination[];
  taskData: Record<string, TripDestination>;
}) {
  const c = useCanvas();
  const [justCreated, setJustCreated] = useState<{ tripId: string; destination: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (!c.mounted) return <div className="min-h-screen bg-canvasbg" aria-hidden />;

  const hasTrips = c.data.trips.length > 0;
  const activeTheme = getTheme(c.activeTrip?.destination);

  const create = (input: { destination: string; cityName: string; homeCity: string; tripDate: string }) => {
    const id = c.createTrip(input);
    setJustCreated({ tripId: id, destination: input.destination });
    setShowCreate(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvasbg text-white" style={themeVars(activeTheme)}>
      {/* Ambient cinematic backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <DestinationImage
          src={activeTheme.heroImage}
          alt=""
          sizes="100vw"
          scrim={false}
          className="h-[80vh] w-full opacity-[0.32]"
        />
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 18%, rgba(30,111,184,0.40), transparent 52%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-canvasbg/40 via-canvasbg/85 to-canvasbg" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1180px] px-6 pb-16 pt-8 sm:px-10">
        {/* Top bar */}
        <div className="mb-10 flex items-center justify-between sm:mb-12">
          <span className="font-display text-2xl font-semibold">Routt</span>
          <span className="rounded-pill border border-white/12 bg-white/8 px-4 py-2 font-body text-sm text-canvasmuted">
            {c.data.name ? `Welcome back, ${c.data.name}` : "Your travel canvas"}
          </span>
        </div>

        {!hasTrips ? (
          <EmptyState destinations={destinations} onCreate={create} name={c.data.name} />
        ) : (
          <TripActive
            canvas={c}
            destinations={destinations}
            taskData={taskData}
            justCreated={justCreated}
            showCreate={showCreate}
            setShowCreate={setShowCreate}
            onCreate={create}
          />
        )}
      </div>
    </div>
  );
}

/* ── Create form (dark) ────────────────────────────────────────────────── */

function CreateForm({
  destinations,
  onCreate,
  compact = false,
}: {
  destinations: CanvasDestination[];
  onCreate: (i: { destination: string; cityName: string; homeCity: string; tripDate: string }) => void;
  compact?: boolean;
}) {
  const [destination, setDestination] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return setError("Pick where you're going.");
    if (!tripDate) return setError("Add your trip date.");
    if (tripDate < todayISO()) return setError("That date is in the past.");
    const d = destinations.find((x) => x.slug === destination);
    setError(null);
    onCreate({ destination, cityName: d?.title ?? destination, homeCity, tripDate });
  };

  const field = "flex min-h-[52px] items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 font-body text-base text-white";
  return (
    <form onSubmit={submit} className="canvas-tile p-5 sm:p-6">
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
        <label className={field}>
          <MapPin className="h-5 w-5 shrink-0 text-canvasmuted" aria-hidden />
          <span className="sr-only">Destination</span>
          <select value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-transparent text-white focus:outline-none [&>option]:text-ink">
            <option value="" disabled>Where to?</option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>{d.title} — {d.country}</option>
            ))}
          </select>
        </label>
        <label className={field}>
          <Calendar className="h-5 w-5 shrink-0 text-canvasmuted" aria-hidden />
          <span className="sr-only">Trip date</span>
          <input type="date" min={todayISO()} value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="w-full bg-transparent text-white focus:outline-none [color-scheme:dark]" />
        </label>
        <input value={homeCity} onChange={(e) => setHomeCity(e.target.value)} placeholder="From (your city)" aria-label="Home city" className={`${field} placeholder:text-white/40`} />
        <button type="submit" className="flex min-h-[52px] items-center justify-center gap-2 rounded-pill bg-coral px-6 font-body text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.02]">
          <Ticket className="h-5 w-5" aria-hidden /> Create trip
        </button>
      </div>
      {error ? <p className="mt-3 font-body text-sm font-medium text-coral">{error}</p> : null}
    </form>
  );
}

/* ── Empty state ───────────────────────────────────────────────────────── */

function EmptyState({
  destinations,
  onCreate,
  name,
}: {
  destinations: CanvasDestination[];
  onCreate: (i: { destination: string; cityName: string; homeCity: string; tripDate: string }) => void;
  name: string;
}) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center sm:py-24">
      <h1 className="font-display text-5xl font-light leading-[1.02] sm:text-6xl">
        {name ? `Where to next, ${name}?` : "Where to next?"}
      </h1>
      <p className="mx-auto mt-5 max-w-md font-body text-lg leading-relaxed text-canvasmuted">
        Pick a place and a date. Routt issues your boarding pass and builds the
        whole trip around it — countdown, packing, experiences and more.
      </p>
      <div className="mt-8 text-left">
        <CreateForm destinations={destinations} onCreate={onCreate} />
      </div>
    </div>
  );
}

/* ── Trip-active canvas ────────────────────────────────────────────────── */

function Tile({ label, children, className = "" }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`canvas-tile p-6 ${className}`}>
      {label ? <p className="canvas-label mb-4">{label}</p> : null}
      {children}
    </section>
  );
}

function TripActive({
  canvas,
  destinations,
  taskData,
  justCreated,
  showCreate,
  setShowCreate,
  onCreate,
}: {
  canvas: ReturnType<typeof useCanvas>;
  destinations: CanvasDestination[];
  taskData: Record<string, TripDestination>;
  justCreated: { tripId: string; destination: string } | null;
  showCreate: boolean;
  setShowCreate: (v: boolean) => void;
  onCreate: (i: { destination: string; cityName: string; homeCity: string; tripDate: string }) => void;
}) {
  const { data, activeTrip, stamps } = canvas;
  if (!activeTrip) return null;

  const dest = activeTrip.destination;
  const dd = taskData[dest];
  const days = daysUntilTrip(activeTrip.tripDate);
  const doneSet = new Set(activeTrip.done);
  const coords = cityCoords(dest);

  const cd = days > 0 ? days : 0;
  const cdLabel = days > 1 ? "days to go" : days === 1 ? "day to go" : days === 0 ? "leaving today" : "trip underway";

  return (
    <>
      {/* Head */}
      <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
        <h1 className="font-display text-4xl font-light leading-none sm:text-5xl lg:text-[4rem]">
          Your <em className="not-italic text-skyaccent">{activeTrip.cityName}</em> trip
          <br />
          is taking shape.
        </h1>
        <div className="text-right">
          <div className="font-display text-5xl font-semibold leading-none text-skyaccent">{cd}</div>
          <div className="canvas-label mt-1">{cdLabel}</div>
        </div>
      </div>

      {/* Toolbar: switcher + plan another */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {data.trips.length > 1
          ? data.trips.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => canvas.setActiveTrip(t.id)}
                className={`rounded-pill border px-4 py-2 font-body text-sm font-medium ${
                  t.id === activeTrip.id ? "border-skyaccent bg-skyaccent text-canvasbg" : "border-white/15 bg-white/5 text-white/70 hover:border-skyaccent/50"
                }`}
              >
                {t.cityName}
              </button>
            ))
          : null}
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="ml-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-pill border border-white/15 bg-white/5 px-4 font-body text-sm font-semibold text-white hover:bg-white/10"
        >
          <Plus className="h-4 w-4" aria-hidden /> Plan another
        </button>
      </div>
      {showCreate ? <div className="mb-5"><CreateForm destinations={destinations} onCreate={onCreate} compact /></div> : null}

      {/* Primary canvas — the mockup's 3 tiles */}
      <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 lg:row-span-2">
          {dd ? (
            <CountdownTile tasks={dd.tasks} days={days} done={doneSet} onToggle={(id) => canvas.toggleTask(activeTrip.id, id)} />
          ) : (
            <Tile label={`Your countdown`} className="h-full">
              <p className="font-body text-sm text-canvasmuted">
                A detailed checklist for {activeTrip.cityName} is coming soon. Your
                boarding pass, packing list, savings and experiences are ready below.
              </p>
            </Tile>
          )}
        </div>
        <ExperienceTile destination={dest} cityName={activeTrip.cityName} />
        <SavingsTile />
      </div>

      {/* Boarding pass */}
      <div className="mt-[18px]">
        <p className="canvas-label mb-3">Your boarding pass</p>
        <BoardingPass trip={activeTrip} totalTasks={dd?.tasks.length ?? 0} issuing={justCreated?.tripId === activeTrip.id} />
      </div>

      {/* Packing */}
      {coords ? (
        <div className="mt-[18px]">
          <Tile label="Smart packing list">
            <PackingList
              key={activeTrip.id}
              tripId={activeTrip.id}
              destination={dest}
              cityName={activeTrip.cityName}
              lat={coords.lat}
              lng={coords.lng}
              startDate={activeTrip.tripDate}
            />
          </Tile>
        </div>
      ) : null}

      {/* Identity artifacts */}
      <div className="mt-[18px] grid gap-[18px] lg:grid-cols-2">
        <StampPassport
          name={data.name}
          avatar={data.theme}
          stamps={stamps}
          justEarned={justCreated?.destination ?? null}
          onName={canvas.setName}
          onAvatar={canvas.setTheme}
        />
        <WorldMap visited={data.visited} onToggle={canvas.toggleVisited} />
      </div>
    </>
  );
}
