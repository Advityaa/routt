"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { CredibilityVerdict } from "@/lib/types";

/**
 * SavedPlaceTag — the Trip screen's signature luggage-tag motif (handoff §3):
 * die-cut left stub with string loop + grommet hole + vertical RT·NN code,
 * dashed perforation, serif title, verdict chip. Every saved place gets one.
 * Rotation is deterministic per id (parent computes it) so tags never jump
 * between renders. Entrance animation respects prefers-reduced-motion via the
 * global kill-switch.
 */
export interface SavedPlaceTagProps {
  code: string; // "RT · 01"
  category: string;
  neighborhood?: string;
  title: string;
  verdict: CredibilityVerdict;
  rotation: number; // degrees, small
  href?: string;
  delayMs?: number;
  onRemove: () => void;
}

const CHIP: Record<CredibilityVerdict, { label: string; color: string }> = {
  "still-good": { label: "Still good", color: "var(--accent)" },
  fading: { label: "Fading", color: "var(--verdict-fading)" },
  "tourist-trap": { label: "Tourist trap", color: "var(--verdict-trap)" },
  mixed: { label: "Mixed reports", color: "var(--muted)" },
  unrated: { label: "Not rated yet", color: "#B5AE9C" },
};

export default function SavedPlaceTag({ code, category, neighborhood, title, verdict, rotation, href, delayMs = 0, onRemove }: SavedPlaceTagProps) {
  const muted = verdict === "unrated";
  const chip = CHIP[verdict];
  const body = (
    <>
      <div className="relative flex w-[56px] shrink-0 flex-col items-center justify-center border-r-[1.5px] border-dashed border-line pt-1.5">
        <svg className="absolute -top-[11px]" width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden>
          <path d="M13 16C13 16 6 12 8 6C9.5 1.5 16.5 1.5 18 6C19.5 10.5 13 16 13 16Z" stroke={muted ? "#D8D2C0" : "#B5AE9C"} strokeWidth="1.4" />
        </svg>
        <span className="mt-1.5 h-[13px] w-[13px] rounded-full border-2 border-muted bg-elevate" aria-hidden />
        <span className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted" style={{ writingMode: "vertical-rl" }}>{code}</span>
      </div>
      <div className="relative min-w-0 flex-1 px-4 py-4 pr-[18px]">
        <div className="mb-[5px] font-mono text-[10px] uppercase tracking-[0.05em] text-muted">
          {category}{neighborhood ? ` · ${neighborhood}` : ""}
        </div>
        <div className={`mb-2 pr-5 font-display text-[18px] font-medium leading-[1.2] ${muted ? "text-muted" : "text-fg"}`}>{title}</div>
        <span className="inline-flex items-center gap-[5px] text-[11px] font-semibold" style={{ color: chip.color }}>
          {verdict === "still-good" ? (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10.5L8 14.5L16 6" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10" cy="10" r="7" /></svg>
          )}
          {chip.label}
        </span>
      </div>
    </>
  );
  return (
    <div className="relative mb-[22px]" style={{ transform: `rotate(${rotation}deg)` }}>
      <div className="animate-rise flex bg-surface shadow-[0_10px_22px_-12px_rgba(28,26,22,0.22)]" style={{ borderRadius: "4px 16px 16px 4px", animationDelay: `${delayMs}ms` }}>
        {href ? <Link href={href} className="flex min-w-0 flex-1">{body}</Link> : <div className="flex min-w-0 flex-1">{body}</div>}
        <button onClick={onRemove} aria-label={`Remove ${title} from trip`}
          className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full text-muted transition hover:text-fg">
          <X size={10} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}

/** Deterministic tag rotation from an id: −2.5°..+2.5° in 0.5° steps; parent
 *  nudges collisions between neighbours. */
export function tagRotation(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return ((h % 11) - 5) * 0.5;
}
