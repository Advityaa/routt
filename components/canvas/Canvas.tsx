"use client";

import { useState } from "react";
import { Backpack, MapPin, Calendar, Plus, Sparkles, Ticket } from "lucide-react";
import DestinationImage from "@/components/DestinationImage";
import TaskItem from "@/components/trip/TaskItem";
import ForexCalculator from "@/components/trip/ForexCalculator";
import GetYourGuideWidget from "@/components/experiences/GetYourGuideWidget";
import PackingList from "@/components/canvas/PackingList";
import { gygLocationId } from "@/lib/experiences/widgets";
import { cityCoords } from "@/lib/packing/data";
import {
  daysUntilTrip,
  taskState,
  URGENCY_ORDER,
} from "@/lib/countdown";
import { getTheme, themeVars } from "@/lib/theme";
import type { TripDestination } from "@/lib/trip-types";
import { useCanvas } from "@/lib/canvas/store";
import BoardingPass from "./BoardingPass";
import StampPassport from "./StampPassport";
import WorldMap from "./WorldMap";

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

  // Pre-hydration: keep SSR + client identical.
  if (!c.mounted) return <div className="min-h-[70vh]" aria-hidden />;

  const hasTrips = c.data.trips.length > 0;
  const activeTheme = getTheme(c.activeTrip?.destination);

  const create = (input: {
    destination: string;
    cityName: string;
    homeCity: string;
    tripDate: string;
  }) => {
    const id = c.createTrip(input);
    setJustCreated({ tripId: id, destination: input.destination });
    setShowCreate(false);
  };

  return (
    <div className="relative min-h-[80vh]" style={themeVars(activeTheme)}>
      {/* Ambient cinematic backdrop — low opacity, blue-harmonised */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {hasTrips && activeTheme.heroImage ? (
          <DestinationImage
            src={activeTheme.heroImage}
            alt=""
            sizes="100vw"
            scrim={false}
            className="h-[60vh] w-full opacity-[0.13]"
          />
        ) : (
          <div className="h-[60vh] w-full bg-gradient-to-b from-fill to-bg" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/85 to-bg" />
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
  );
}

/* ── Empty / new state ─────────────────────────────────────────────────── */

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

  return (
    <form
      onSubmit={submit}
      className="rounded-card border border-white/40 bg-white/80 p-5 shadow-lift backdrop-blur-md sm:p-6"
    >
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
        <label className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-hairline bg-white px-4">
          <MapPin className="h-5 w-5 shrink-0 text-ink/40" aria-hidden />
          <span className="sr-only">Destination</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-transparent font-body text-base text-ink focus:outline-none"
          >
            <option value="" disabled>
              Where to?
            </option>
            {destinations.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.title} — {d.country}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-hairline bg-white px-4">
          <Calendar className="h-5 w-5 shrink-0 text-ink/40" aria-hidden />
          <span className="sr-only">Trip date</span>
          <input
            type="date"
            min={todayISO()}
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
            className="w-full bg-transparent font-body text-base text-ink focus:outline-none"
          />
        </label>

        <input
          value={homeCity}
          onChange={(e) => setHomeCity(e.target.value)}
          placeholder="From (your city)"
          aria-label="Home city"
          className="min-h-[48px] rounded-2xl border border-hairline bg-white px-4 font-body text-base text-ink focus:outline-none"
        />

        <button
          type="submit"
          className="flex min-h-[48px] items-center justify-center gap-2 rounded-pill bg-coral px-6 font-body text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
        >
          <Ticket className="h-5 w-5" aria-hidden />
          Create trip
        </button>
      </div>
      {error ? <p className="mt-3 font-body text-sm font-medium text-coral">{error}</p> : null}
    </form>
  );
}

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
    <div className="mx-auto max-w-2xl px-6 py-20 text-center sm:py-28">
      <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-white px-3.5 py-1.5 font-body text-xs font-medium uppercase tracking-wider text-primary shadow-soft">
        <Sparkles className="h-3.5 w-3.5" aria-hidden /> Your travel canvas
      </span>
      <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
        {name ? `Where to next, ${name}?` : "Where to next?"}
      </h1>
      <p className="mx-auto mt-4 max-w-md font-body text-lg leading-relaxed text-ink/65">
        Pick a place and a date. Routt issues your boarding pass and builds the
        whole trip around it — countdown, prep, experiences and more.
      </p>
      <div className="mt-8 text-left">
        <CreateForm destinations={destinations} onCreate={onCreate} />
      </div>
    </div>
  );
}

/* ── Trip-active canvas ────────────────────────────────────────────────── */

function Tile({
  title,
  icon,
  children,
  id,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 rounded-card border border-hairline bg-white/85 p-5 shadow-soft backdrop-blur-sm sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
        {icon}
        {title}
      </h2>
      <div className="mt-4">{children}</div>
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
  const locationId = gygLocationId(dest);
  const coords = cityCoords(dest);

  const sortedTasks = dd
    ? [...dd.tasks].sort((a, b) => {
        const sa = URGENCY_ORDER.indexOf(taskState(a, days, doneSet.has(a.id)));
        const sb = URGENCY_ORDER.indexOf(taskState(b, days, doneSet.has(b.id)));
        return sa - sb || b.leadTimeDays - a.leadTimeDays;
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      {/* Greeting + identity peek */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-body text-sm font-medium uppercase tracking-wider text-primary/70">
            {data.name ? `Welcome back, ${data.name}` : "Your canvas"}
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold text-ink sm:text-5xl">
            {days >= 0 ? `${activeTrip.cityName} awaits` : `${activeTrip.cityName}`}
          </h1>
          <p className="mt-1 font-body text-base text-ink/60">
            {stamps.length} {stamps.length === 1 ? "stamp" : "stamps"} ·{" "}
            {data.visited.length} countries explored
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-pill border border-hairline bg-white px-4 font-body text-sm font-semibold text-navy shadow-soft hover:bg-fill/40"
        >
          <Plus className="h-4 w-4" aria-hidden /> Plan another
        </button>
      </div>

      {showCreate ? (
        <div className="mt-5">
          <CreateForm destinations={destinations} onCreate={onCreate} compact />
        </div>
      ) : null}

      {/* Boarding pass hero */}
      <div className="mt-6">
        <BoardingPass
          trip={activeTrip}
          totalTasks={dd?.tasks.length ?? 0}
          issuing={justCreated?.tripId === activeTrip.id}
          onOpen={() => document.getElementById("prep")?.scrollIntoView({ behavior: "smooth" })}
        />
      </div>

      {/* Multi-trip switcher */}
      {data.trips.length > 1 ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {data.trips.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => canvas.setActiveTrip(t.id)}
              className={`shrink-0 rounded-pill border px-4 py-2 font-body text-sm font-medium ${
                t.id === activeTrip.id
                  ? "border-primary bg-primary text-white"
                  : "border-hairline bg-white text-ink/70 hover:border-primary/40"
              }`}
            >
              {t.cityName}
            </button>
          ))}
        </div>
      ) : null}

      {/* Tiles */}
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Tile id="prep" title="Your prep" icon={<Sparkles className="h-5 w-5 text-primary" />}>
          {sortedTasks.length ? (
            <div className="space-y-3">
              {sortedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  destination={dest}
                  tripDateISO={activeTrip.tripDate}
                  daysUntil={days}
                  done={doneSet.has(task.id)}
                  onToggle={() => canvas.toggleTask(activeTrip.id, task.id)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-card border border-hairline bg-fill/30 px-4 py-6 text-center font-body text-sm text-ink/55">
              A detailed checklist for {activeTrip.cityName} is coming soon. Your
              boarding pass, savings and experiences are ready below.
            </p>
          )}
        </Tile>

        <div className="space-y-5">
          <Tile title="You'll save with the right card" icon={<Sparkles className="h-5 w-5 text-primary" />}>
            <ForexCalculator destination={dest} partnerId="niyo" />
          </Tile>

          <Tile title={`Worth seeing in ${activeTrip.cityName}`} icon={<MapPin className="h-5 w-5 text-primary" />}>
            {locationId ? (
              <GetYourGuideWidget type="city" locationId={locationId} />
            ) : (
              <p className="font-body text-sm text-ink/55">Experiences coming soon.</p>
            )}
            <p className="mt-3 font-body text-xs text-ink/45">
              Bookable via our partner — Routt may earn a commission, at no extra
              cost to you. Prices shown live by the provider.
            </p>
          </Tile>
        </div>
      </div>

      {/* Smart packing list */}
      {coords ? (
        <div className="mt-5">
          <Tile id="packing" title="Smart packing list" icon={<Backpack className="h-5 w-5 text-primary" />}>
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
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
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
    </div>
  );
}
