"use client";

import { useState } from "react";
import type { Category } from "@/lib/types";
import VerdictBadge from "@/components/VerdictBadge";
import Button from "@/components/Button";
import CategoryPills from "@/components/CategoryPills";
import PlaceCard from "@/components/PlaceCard";
import EventItem from "@/components/EventItem";

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-[15px] font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {note ? <p className="mt-1 max-w-prose text-[13px] text-muted">{note}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

const SWATCHES: { name: string; varName: string; hex: string }[] = [
  { name: "canvas", varName: "--canvas", hex: "#FAFAF8" },
  { name: "surface", varName: "--surface", hex: "#FFFFFF" },
  { name: "elevate", varName: "--elevate", hex: "#F3F3EE" },
  { name: "line", varName: "--line", hex: "#ECECE6" },
  { name: "fg", varName: "--fg", hex: "#1B1B16" },
  { name: "muted", varName: "--muted", hex: "#6E6E64" },
  { name: "faint", varName: "--faint", hex: "#A6A69A" },
  { name: "accent", varName: "--accent", hex: "#1F8A5B" },
  { name: "accent-fill", varName: "--accent-fill", hex: "#DBF0E4" },
  { name: "accent-soft", varName: "--accent-soft", hex: "#E4E4DC" },
];

const VERDICT_SWATCHES = [
  { name: "verdict-good", varName: "--verdict-good", hex: "#1F8A5B (=accent)" },
  { name: "verdict-fading", varName: "--verdict-fading", hex: "#9A6410" },
  { name: "verdict-trap", varName: "--verdict-trap", hex: "#B23A2E" },
];

export default function Showcase() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [category, setCategory] = useState<Category>("eat");

  return (
    <div data-theme={theme} className="min-h-[100dvh] bg-canvas text-fg">
      <div className="mx-auto max-w-[420px] px-5 pb-24 pt-8">
        {/* Header */}
        <header className="flex items-end justify-between border-b border-line pb-5">
          <div>
            <div className="text-eyebrow uppercase text-muted">Design System</div>
            <h1 className="font-display text-display-lg font-semibold tracking-tight">Routt</h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </header>

        <p className="mt-4 max-w-prose text-[14px] text-muted">
          Light editorial theme. Near-white paper, serif display (Fraunces), grotesk body
          (Schibsted), and one <span className="text-accent">calm green accent</span> shared by
          interaction and the &quot;Still good&quot; verdict. Fading/trap keep quiet semantic colors.
        </p>

        {/* Verdict badges — the signature element */}
        <Section
          title="Verdict badge"
          note="The signature element. Color- and shape-coded; reasoning in mono reads as verified evidence."
        >
          <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-5">
            <VerdictBadge verdict="still-good" reason="40+ recent local reviews, steady 6 months" />
            <VerdictBadge verdict="fading" reason="Reviews down 30% since the viral reel" />
            <VerdictBadge verdict="tourist-trap" reason="92% of reviews from tourists; locals stopped going" />
            <VerdictBadge verdict="unrated" reason="Only 3 reviews so far — too soon to call" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-surface p-5">
            <span className="text-eyebrow uppercase text-faint">Badge only · sm</span>
            <VerdictBadge verdict="still-good" size="sm" showReason={false} />
            <VerdictBadge verdict="fading" size="sm" showReason={false} />
            <VerdictBadge verdict="tourist-trap" size="sm" showReason={false} />
            <VerdictBadge verdict="unrated" size="sm" showReason={false} />
          </div>
        </Section>

        {/* Place card — the ranked feed */}
        <Section title="Place card" note="A short ranked list (3–5). Photo is a small supporting thumbnail — the verdict stays the hero. No photo → palette placeholder.">
          <div className="flex flex-col gap-3">
            <PlaceCard
              rank={1}
              name="Cantina Royal"
              category="eat"
              verdict="still-good"
              reason="40+ recent local reviews, steady 6 months"
              neighborhood="La Roma"
              distance="450 m"
              cost="~$8 / dish"
              busy="busy"
              photo={{ url: "/mock-photos/eat-jok-prince.jpg", source: "google", attribution: "hkgalbert · CC BY-SA 3.0 · Wikimedia Commons" }}
            />
            <PlaceCard
              rank={2}
              name="Bar Oriente"
              category="drink"
              verdict="fading"
              reason="Reviews down 30% since the viral reel"
              neighborhood="Centro"
              distance="1.2 km"
              cost="~$12 / cocktail"
              busy="quiet"
            />
            <PlaceCard
              rank={3}
              name="Mirador Lookout"
              category="see"
              verdict="tourist-trap"
              reason="92% of reviews from tourists; locals stopped going"
              neighborhood="Old Town"
              distance="2.0 km"
              cost="~$9 entry"
              busy="quiet"
            />
          </div>
        </Section>

        {/* Category pills */}
        <Section title="Category filter" note="One engine, many categories — tags on the same feed, not separate screens.">
          <CategoryPills value={category} onChange={setCategory} />
          <p className="mt-3 font-mono text-[12px] text-muted">
            active: <span className="text-fg">{category}</span>
          </p>
        </Section>

        {/* Buttons */}
        <Section title="Buttons" note="Primary uses the green accent; fading/trap colors stay reserved for verdicts.">
          <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Save trip</Button>
              <Button variant="secondary">Directions</Button>
              <Button variant="ghost">Skip</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">Save</Button>
              <Button variant="secondary" size="sm">Share</Button>
              <Button variant="primary" disabled>Saved</Button>
            </div>
          </div>
        </Section>

        {/* Events */}
        <Section title="Event item" note="This week near you. Mono date block; plainspoken name + venue.">
          <div className="flex flex-col gap-3">
            <EventItem day="TUE" date="02" name="Mercado de San Juan night market" venue="San Juan" when="18:00" tag="Market" />
            <EventItem day="FRI" date="05" name="Rooftop jazz session" venue="Hotel Carlota" when="21:00" tag="Live music" />
          </div>
        </Section>

        {/* Palette */}
        <Section title="Palette" note="Role-based tokens (hex shown for the light theme).">
          <div className="grid grid-cols-2 gap-3">
            {SWATCHES.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-badge border border-line bg-surface p-2.5">
                <span
                  className="h-9 w-9 shrink-0 rounded-md border border-line"
                  style={{ background: `var(${s.varName})` }}
                />
                <div className="min-w-0">
                  <div className="truncate font-mono text-[12px] text-fg">{s.name}</div>
                  <div className="font-mono text-[11px] text-faint">{s.hex}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3">
            {VERDICT_SWATCHES.map((s) => (
              <div key={s.name} className="flex items-center gap-3 rounded-badge border border-line bg-surface p-2.5">
                <span className="h-9 w-9 shrink-0 rounded-md" style={{ background: `var(${s.varName})` }} />
                <div>
                  <div className="font-mono text-[12px] text-fg">{s.name}</div>
                  <div className="font-mono text-[11px] text-faint">{s.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Type */}
        <Section title="Type" note="Fraunces (display) · Schibsted Grotesk (body) · IBM Plex Mono (evidence).">
          <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5">
            <div>
              <div className="text-eyebrow uppercase text-faint">display · fraunces</div>
              <p className="font-display text-display-lg font-semibold">Tells you the truth</p>
            </div>
            <div>
              <div className="text-eyebrow uppercase text-faint">body · schibsted grotesk</div>
              <p className="text-[15px] text-fg">
                Right now, near you — what's genuinely worth going to.
              </p>
            </div>
            <div>
              <div className="text-eyebrow uppercase text-faint">mono · ibm plex mono</div>
              <p className="font-mono text-[13px] text-muted">40+ recent local reviews · steady 6 months</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
