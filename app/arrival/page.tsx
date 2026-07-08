"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import AffiliateLink from "@/components/AffiliateLink";
import { BKK_RANGES, judgePrice, type HaggleVerdict } from "@/lib/haggle";
import { useState as useState2 } from "react";

/**
 * Arrival — the "arrival card" screen (design handoff: no photo hero here,
 * deliberately). Data-driven checklist + 1:1 segment progress, all offline-
 * capable (SW-cached shell, state in localStorage).
 */
const HOTEL_KEY = "routt.hotelAddress";
const CHECK_KEY = "routt.arrivalChecklist";

interface ChecklistItem { title: string; description: string; highlightedTerms: string[] }

// Per-city later; Bangkok v1. Content matches the mockup exactly.
const ITEMS: ChecklistItem[] = [
  { title: "Turn off mobile data on your SIM", description: "Leave the SIM in — you still want the OTPs from your bank and apps. Just switch off mobile data so you don't get hit with roaming charges. Grab a local eSIM for data.", highlightedTerms: ["mobile data"] },
  { title: "Open Grab, not street taxis", description: "Book with Grab — the fare is fixed in-app and there's a record of the ride. Skip drivers who wave you over or refuse the meter.", highlightedTerms: ["Grab"] },
  { title: "Airport Rail Link into the city — ฿45", description: "From Suvarnabhumi, the Airport Rail Link reaches the city in ~30 min for about ฿45 — faster and cheaper than a taxi in traffic. Runs ~06:00–24:00.", highlightedTerms: ["Airport Rail Link", "฿45"] },
  { title: "Save your hotel address, offline", description: "Screenshot the Thai script version of your hotel's address — useful if a driver needs to read it, and works without signal.", highlightedTerms: ["Thai script"] },
  { title: "Withdraw cash at the airport ATM", description: "Airport ATMs charge a flat fee regardless of amount — take out enough for 2–3 days so you're not paying it twice.", highlightedTerms: ["ATMs"] },
];

/** Render a description with soft-highlight spans from highlightedTerms data. */
function Desc({ text, terms }: { text: string; terms: string[] }) {
  let parts: (string | { t: string })[] = [text];
  for (const term of terms) {
    parts = parts.flatMap((p) =>
      typeof p !== "string" ? [p] : p.split(term).flatMap((seg, i, a) => (i < a.length - 1 ? [seg, { t: term }] : [seg])),
    );
  }
  return (
    <p className="mt-1.5 text-[13px] leading-[1.55] text-muted">
      {parts.map((p, i) =>
        typeof p === "string" ? p : (
          <span key={i} className="rounded-[5px] bg-elevate px-[5px] py-px font-medium text-fg">{p.t}</span>
        ),
      )}
    </p>
  );
}

/** Deterministic arrival-card number: BKK-MMDD-NNNN (stable for the day). */
function cardNo(): string {
  const d = new Date();
  const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  let h = 0;
  for (const c of mmdd) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `BKK-${mmdd}-${(h % 9000) + 1000}`;
}

export default function ArrivalPage() {
  const [done, setDone] = useState<boolean[]>(() => ITEMS.map(() => false));
  const [hotel, setHotel] = useState("");
  const [savedHotel, setSavedHotel] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CHECK_KEY) ?? "[]");
      if (Array.isArray(stored) && stored.length === ITEMS.length) setDone(stored);
      const h = localStorage.getItem(HOTEL_KEY) ?? "";
      setHotel(h); setSavedHotel(h);
    } catch {}
  }, []);

  function toggle(i: number) {
    setDone((prev) => {
      const next = prev.map((v, j) => (j === i ? !v : v));
      try { localStorage.setItem(CHECK_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function saveHotel() {
    try { localStorage.setItem(HOTEL_KEY, hotel); setSavedHotel(hotel); } catch {}
  }

  const doneCount = done.filter(Boolean).length;

  return (
    <main className="mx-auto min-h-[100dvh] max-w-[440px] bg-canvas pb-28">
      {/* Top bar: back + "Works offline" stamp badge */}
      <div className="flex items-center justify-between px-5 pt-5">
        <Link href="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-line">
          <ArrowLeft size={16} strokeWidth={2} className="text-fg" />
        </Link>
        <span className="flex items-center gap-1.5 rounded-pill border-[1.5px] border-dashed border-accent px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em] text-accent">
          <Check size={11} strokeWidth={2.2} /> Works offline
        </span>
      </div>

      {/* Perforated divider (die-cut notches at the sheet edges) */}
      <div className="relative mx-5 mt-5 border-t-[1.5px] border-dashed border-line">
        <span aria-hidden className="absolute -left-[27px] -top-[7px] h-3.5 w-3.5 rounded-full bg-elevate shadow-[inset_0_1px_2px_rgba(28,26,22,0.18)]" />
        <span aria-hidden className="absolute -right-[27px] -top-[7px] h-3.5 w-3.5 rounded-full bg-elevate shadow-[inset_0_1px_2px_rgba(28,26,22,0.18)]" />
      </div>

      {/* Header */}
      <header className="px-5 pt-5">
        <div className="mb-2.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted">
          Bangkok · Arrival Card No. {cardNo()}
        </div>
        <h1 className="font-display text-[30px] font-medium leading-[1.1] tracking-[-0.01em] text-fg">Just landed</h1>
        <p className="mt-2 text-[13.5px] text-muted">The five things to do before you leave the airport.</p>
      </header>

      {/* Segment progress — each segment mapped 1:1 to its item */}
      <div className="px-5 pt-6">
        <div className="mb-2 flex justify-between font-mono text-[10.5px] uppercase tracking-[0.04em] text-muted">
          <span><span className="font-medium text-accent" data-testid="done-count">{doneCount}</span> of {ITEMS.length} done</span>
          <span>Tap to check off</span>
        </div>
        <div className="flex gap-[5px]" data-testid="segments">
          {done.map((d, i) => (
            <span key={i} className={`h-2 flex-1 rounded-[3px] transition-colors ${d ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
      </div>

      {/* Checklist — data-driven */}
      <div className="px-5 pt-2">
        {ITEMS.map((item, i) => (
          <div key={item.title} className={`flex gap-3.5 py-5 ${i < ITEMS.length - 1 ? "border-b border-line" : ""}`}>
            <span
              role="checkbox"
              aria-checked={done[i]}
              aria-label={item.title}
              tabIndex={0}
              onClick={() => toggle(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(i); } }}
              className={`mt-0.5 flex h-[25px] w-[25px] shrink-0 cursor-pointer items-center justify-center rounded-[7px] border-[1.5px] transition-colors ${done[i] ? "border-accent bg-accent" : "border-muted bg-transparent"}`}
            >
              <Check size={13} strokeWidth={2.6} className={`text-white transition-opacity ${done[i] ? "opacity-100" : "opacity-0"}`} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 font-mono text-[10.5px] text-muted">{String(i + 1).padStart(2, "0")}</div>
              <div className={`text-[15px] font-semibold leading-[1.3] ${done[i] ? "text-muted line-through decoration-[var(--line)]" : "text-fg"}`}>{item.title}</div>
              <Desc text={item.description} terms={item.highlightedTerms} />
            </div>
          </div>
        ))}
      </div>

      {/* ——— Below the card: shipped arrival tools (not in mockup; kept deliberately) ——— */}
      <div className="mt-2 px-5">
        <div className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Hotel address · stored on this device</div>
        <textarea value={hotel} onChange={(e) => setHotel(e.target.value)} rows={2}
          placeholder="Hotel name + address (paste the Thai too, if you have it)"
          className="w-full resize-none rounded-card border border-line bg-surface px-3.5 py-2.5 text-[14px] text-fg placeholder:text-muted focus:border-fg/40 focus:outline-none" />
        <button onClick={saveHotel} disabled={hotel === savedHotel}
          className="mt-2 h-9 rounded-pill bg-fg px-4 text-[13px] font-semibold text-canvas transition hover:opacity-90 disabled:bg-elevate disabled:text-faint">
          {hotel === savedHotel && savedHotel ? "Saved" : "Save address"}
        </button>
      </div>

      <HaggleHelper />

      <section className="mt-8 px-5" data-testid="survival">
        <h2 className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Bangkok survival card · works offline</h2>
        <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 text-[13px] leading-relaxed">
          <p><span className="font-semibold text-fg">Emergency:</span> <a className="underline" href="tel:191">191 police</a> · <a className="underline" href="tel:1155">1155 tourist police (EN)</a> · <a className="underline" href="tel:1669">1669 ambulance</a></p>
          <p><span className="font-semibold text-fg">Embassy (IN):</span> 46 Soi Prasarnmitr, Sukhumvit 23 · <a className="underline" href="tel:+6622580300">+66 2 258 0300</a></p>
          <p><span className="font-semibold text-fg">Phrases:</span> sawasdee (hello) · khop khun (thanks) · tao rai? (how much?) · mai ao (no thanks) · hong nam (toilet)</p>
          <p><span className="font-semibold text-fg">Tipping:</span> not expected; round up taxis, ~10% nice at sit-down restaurants.</p>
          <p><span className="font-semibold text-fg">Do:</span> remove shoes at temples, dress modestly at wats. <span className="font-semibold text-fg">Don&apos;t:</span> disrespect the monarchy (illegal), touch heads, point feet at Buddha images.</p>
        </div>
      </section>

      <section className="mt-8 px-5">
        <h2 className="mb-3.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted">Sort before you fly</h2>
        <div className="flex flex-col gap-3">
          <AffiliateLink href="https://example.com/aff/esim?ref=routt" label="Get a Bangkok eSIM" sub="Data the moment you land — no SIM swap needed" />
          <AffiliateLink href="https://example.com/aff/forex?ref=routt" label="Multi-currency travel card" sub="Spend in ฿ without the airport-counter markup" />
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-faint">
          Some links above are affiliate links — if you buy through them, Routt may earn a small commission, at no extra cost to you.
        </p>
      </section>
    </main>
  );
}

function HaggleHelper() {
  const [key, setKey] = useState2(BKK_RANGES[0].key);
  const [price, setPrice] = useState2("");
  const range = BKK_RANGES.find((r) => r.key === key)!;
  const res = price.trim() ? judgePrice(range, Number(price)) : null;
  const COLOR: Record<HaggleVerdict, string> = { fair: "var(--accent)", overpriced: "var(--verdict-fading)", scam: "var(--verdict-trap)" };
  return (
    <section className="mt-8" data-testid="haggle">
      <h2 className="text-eyebrow uppercase text-muted">Fair price check</h2>
      <div className="mt-3 rounded-card border border-line bg-surface p-4">
        <div className="flex gap-2">
          <select value={key} onChange={(e) => setKey(e.target.value)} aria-label="What are you buying?"
            className="h-10 min-w-0 flex-1 rounded-pill border border-line bg-elevate px-3 text-[13px] text-fg">
            {BKK_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="Quoted ฿"
            className="h-10 w-[110px] rounded-pill border border-line bg-elevate px-3 text-[13px] text-fg placeholder:text-faint" />
        </div>
        {res ? (
          <p className="mt-3 text-[13.5px]" data-testid="haggle-verdict">
            <span className="font-semibold uppercase" style={{ color: COLOR[res.verdict] }}>{res.verdict}</span>
            <span className="text-muted"> — {res.note}</span>
          </p>
        ) : null}
        <p className="mt-2 font-mono text-[10.5px] text-faint">Reference ranges, guidance not guarantee — prices drift with season & fuel.</p>
      </div>
    </section>
  );
}
