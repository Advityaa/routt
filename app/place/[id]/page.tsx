"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bookmark, Check } from "lucide-react";
import type { Category, ScoredPlace, CredibilityVerdict } from "@/lib/types";
import { getPlaceById } from "@/lib/dataProvider";
import { summarizeWhenToGo, toLocalTHB } from "@/lib/insights";
import { isSaved, toggleSaved } from "@/lib/savedTrip";
import { getVenueImage } from "@/lib/placeholderImages";
import BusyChart from "@/components/BusyChart";
import GettingThereBack from "@/components/GettingThereBack";
import TrustReport from "@/components/TrustReport";
import ContributeCard from "@/components/ContributeCard";

const UGC_ENABLED = process.env.NEXT_PUBLIC_DATA_MODE === "db";
const BANGKOK_DEFAULT = { lat: 13.7376, lng: 100.5602 };
const CATEGORY_LABEL: Record<Category, string> = { eat: "Eat", drink: "Drink", shop: "Shop", see: "See" };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">{children}</div>;
}

/** Passport stamp (handoff motif: verify) — dashed circle, curved text, −7° tilt. */
function Stamp({ verdict }: { verdict: CredibilityVerdict }) {
  const spec: Record<CredibilityVerdict, { text: string; color: string }> = {
    "still-good": { text: "VERIFIED · TRUSTED", color: "var(--accent)" },
    fading: { text: "FADING · CHECK FIRST", color: "var(--verdict-fading)" },
    "tourist-trap": { text: "TOURIST TRAP", color: "var(--verdict-trap)" },
    mixed: { text: "MIXED REPORTS", color: "var(--muted)" },
    unrated: { text: "NOT RATED YET", color: "#B5AE9C" },
  };
  const s = spec[verdict];
  return (
    <div className="animate-badge-in relative z-[3] -mt-[46px] ml-[22px] h-[92px] w-[92px]" style={{ transform: "rotate(-7deg)", color: s.color }} data-testid="stamp">
      <div className="flex h-full w-full items-center justify-center rounded-full border-[1.5px] border-dashed border-current bg-canvas shadow-[0_10px_22px_-10px_rgba(28,26,22,0.28)]">
        <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-full border border-current">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 92 92" style={{ inset: "-9px", width: 92, height: 92 }}>
            <defs><path id="curve" d="M 10,46 A 36,36 0 1,1 82,46" fill="transparent" /></defs>
            <text style={{ fontFamily: "var(--font-mono)", fontSize: "7.4px", letterSpacing: "2.2px", fill: "currentColor" }}>
              <textPath href="#curve" startOffset="2">{s.text}</textPath>
            </text>
          </svg>
          {verdict === "still-good" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5L9.5 18L20 6" /></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="10" cy="10" r="7" /></svg>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlaceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [coords, setCoords] = useState(BANGKOK_DEFAULT);
  const [now, setNow] = useState(() => new Date());
  const [hourOverride, setHourOverride] = useState<number | null>(null);
  const [detail, setDetail] = useState<ScoredPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const effectiveHour = hourOverride ?? now.getHours();

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("hour");
    if (raw !== null) {
      const h = Number(raw);
      if (Number.isFinite(h) && h >= 0 && h <= 23) setHourOverride(Math.floor(h));
    }
    const tick = setInterval(() => setNow(new Date()), 30_000);
    navigator?.geolocation?.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}, { timeout: 8000, maximumAge: 300_000 },
    );
    return () => clearInterval(tick);
  }, []);

  useEffect(() => { setSaved(isSaved(id)); }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getPlaceById({ id, lat: coords.lat, lng: coords.lng }).then((res) => {
      if (alive) { setDetail(res); setLoading(false); }
    });
    return () => { alive = false; };
  }, [id, coords.lat, coords.lng]);

  if (!loading && !detail) {
    return (
      <main className="w-full min-h-[100dvh] bg-canvas px-5 pt-9">
        <Link href="/" className="font-mono text-[12.5px] text-muted">← Back</Link>
        <p className="mt-10 text-center font-mono text-[13px] text-muted">We don&apos;t have this place.</p>
      </main>
    );
  }
  if (!detail) {
    return (
      <main className="w-full min-h-[100dvh] bg-canvas">
        <div className="h-[360px] animate-pulse bg-elevate" />
      </main>
    );
  }

  const { place, credibility, distanceMeters } = detail;
  const distanceLabel = distanceMeters < 1000 ? `${distanceMeters} m` : `${(distanceMeters / 1000).toFixed(1)} km`;
  const localCost = toLocalTHB(place.homeCurrencyEstimate);
  const whenToGo = summarizeWhenToGo(place.busyByHour);
  const busyNow = (place.busyByHour[effectiveHour] ?? 0) >= 0.4 ? "Busy" : "Quiet";
  const heroUrl = place.photos?.[0]?.url ?? getVenueImage(place.category, place.id);

  return (
    <main className="w-full min-h-[100dvh] bg-canvas pb-[110px]">
      {/* HERO — photo bg div (degrades to flat color), scrim, glass nav */}
      <section className="relative h-[360px] overflow-hidden bg-[#2a241c]">
        <div className="kenburns absolute -inset-5 bg-cover bg-center" style={{ backgroundImage: `url(${heroUrl})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,9,6,0.45) 0%, rgba(10,9,6,0.05) 24%, rgba(10,9,6,0.2) 48%, rgba(10,9,6,0.88) 82%, rgba(10,9,6,0.97) 100%)" }} />
        <div className="relative z-[2] flex justify-between p-5">
          <Link href="/" aria-label="Back" className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/[0.28] bg-white/[0.16] backdrop-blur-md">
            <ArrowLeft size={17} className="text-white" strokeWidth={2} />
          </Link>
          <button onClick={() => setSaved(toggleSaved(id))} aria-label="Save to trip"
            className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/[0.28] bg-white/[0.16] backdrop-blur-md">
            <Bookmark size={17} className="text-white" strokeWidth={1.8} fill={saved ? "white" : "none"} />
          </button>
        </div>
        <div className="absolute inset-x-[22px] bottom-[46px] z-[2] text-white">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.08em] opacity-[0.82]">
            {CATEGORY_LABEL[place.category]} · {place.neighborhood || "Bangkok"} · {distanceLabel} away
          </div>
          <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.01em]">{place.name}</h1>
          {place.nameLocal ? <p className="mt-1 text-[14px] text-white/70">{place.nameLocal}</p> : null}
        </div>
      </section>

      <Stamp verdict={credibility.verdict} />

      <div className="px-[22px] pt-1">
        {/* verdict line — the reasons as mono receipts */}
        <div className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.05em] text-muted" data-testid="verdict-line">
          {credibility.reasons.map((r, i) => (
            <span key={r}>{i > 0 ? <span className="mx-1.5 opacity-40">/</span> : null}{r}</span>
          ))}
        </div>

        {/* STAT STRIP (handoff motif 5) */}
        <div className="mt-[22px] flex border-y border-line" data-testid="stat-strip">
          {[
            [distanceLabel, "Away"],
            [place.homeCurrencyEstimate || "—", place.homeCurrencyEstimate ? "Est. spend" : "Cost"],
            [busyNow, "Right now"],
          ].map(([v, l], i) => (
            <div key={l} className={`flex-1 px-1.5 py-3.5 text-center ${i > 0 ? "border-l border-line" : ""}`}>
              <div className="font-mono text-[15px] font-medium text-fg">{v}</div>
              <div className="mt-[3px] text-[10.5px] uppercase tracking-[0.04em] text-muted">{l}</div>
            </div>
          ))}
        </div>
        {localCost ? <p className="mt-2 font-mono text-[11px] text-faint">≈ {localCost} · approx</p> : null}

        {/* How we checked this */}
        {place.sources?.length ? (
          <section className="mt-[30px]">
            <SectionLabel>How we checked this</SectionLabel>
            <TrustReport sources={place.sources} crossSourceAgreement={place.crossSourceAgreement} matchConfidence={place.matchConfidence} />
          </section>
        ) : null}

        {/* When to go */}
        {place.busyByHour.some((v) => v > 0) ? (
          <section className="mt-[30px]">
            <SectionLabel>When to go</SectionLabel>
            <BusyChart busyByHour={place.busyByHour} currentHour={effectiveHour} />
            <p className="mt-3 font-display text-[15px] font-medium text-fg">{whenToGo}</p>
            <p className="mt-[3px] text-[12px] text-muted">Dark bar = right now ({effectiveHour}:00)</p>
          </section>
        ) : null}

        {/* Getting there */}
        <section className="mt-[30px]">
          <SectionLabel>Getting there</SectionLabel>
          <GettingThereBack distanceMeters={distanceMeters} hour={effectiveHour} />
        </section>

        {UGC_ENABLED ? <ContributeCard gersId={place.id} venueName={place.name} /> : null}

        {/* Why am I seeing this? */}
        <div className="mt-[30px] border-t border-line pt-4">
          <button onClick={() => setShowWhy((v) => !v)} aria-expanded={showWhy} className="flex w-full items-center justify-between">
            <span className="text-[13.5px] font-medium text-fg">Why am I seeing this?</span>
            <span className={`font-mono text-[14px] text-muted transition-transform ${showWhy ? "rotate-45" : ""}`}>+</span>
          </button>
          {showWhy ? (
            <p className="pt-2.5 text-[12.5px] leading-relaxed text-muted">
              You&apos;re near {place.neighborhood || "here"} and browsing {CATEGORY_LABEL[place.category]} right now. Routt weighs
              recent reports, whether they come from locals, and how much sources agree — never just a star average.
              Credibility score {credibility.score}/100.
            </p>
          ) : null}
        </div>
      </div>

      {/* STICKY CTA */}
      <div className="fixed bottom-0 left-1/2 z-[5] w-full -translate-x-1/2 px-[22px] pb-[26px] pt-[30px]" style={{ background: "linear-gradient(180deg, rgba(250,246,237,0) 0%, var(--canvas) 30%)" }}>
        <button onClick={() => setSaved(toggleSaved(id))}
          className={`flex w-full items-center justify-center gap-2 rounded-pill border-[1.5px] py-[15px] text-[14px] font-semibold transition ${saved ? "border-fg bg-canvas text-fg" : "border-fg bg-fg text-canvas"}`}>
          {saved ? <><Check size={15} strokeWidth={2.4} /> Saved to trip</> : "Save to trip"}
        </button>
      </div>
    </main>
  );
}
