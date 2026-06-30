"use client";

import { Plane, Globe2, Luggage, Map, Compass, Palmtree, Stamp, type LucideIcon } from "lucide-react";

/**
 * A playful travel identity — NOT a real passport. Display name + a chosen
 * avatar (lucide icon) + earned destination stamps. No passport numbers, no
 * scans, no government fields. Stamps press in with an animation.
 */

const STAMP_NAME: Record<string, string> = {
  dubai: "DUBAI",
  "abu-dhabi": "ABU DHABI",
  bangkok: "BANGKOK",
  singapore: "SINGAPORE",
  bali: "BALI",
  "kuala-lumpur": "KUALA LUMPUR",
};

const AVATARS: { key: string; Icon: LucideIcon }[] = [
  { key: "plane", Icon: Plane },
  { key: "globe", Icon: Globe2 },
  { key: "luggage", Icon: Luggage },
  { key: "map", Icon: Map },
  { key: "compass", Icon: Compass },
  { key: "palm", Icon: Palmtree },
];

function AvatarIcon({ k, className }: { k: string; className?: string }) {
  const found = AVATARS.find((a) => a.key === k) ?? AVATARS[0];
  const C = found.Icon;
  return <C className={className} strokeWidth={1.75} aria-hidden />;
}

export default function StampPassport({
  name,
  avatar,
  stamps,
  justEarned,
  onName,
  onAvatar,
}: {
  name: string;
  avatar: string;
  stamps: string[];
  justEarned?: string | null;
  onName?: (v: string) => void;
  onAvatar?: (v: string) => void;
}) {
  const slotCount = Math.max(6, Math.ceil((stamps.length + 2) / 3) * 3);
  const slots = Array.from({ length: slotCount }, (_, i) => stamps[i] ?? null);

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[#0c2036] text-white">
      {/* Cover */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="min-w-0">
          <p className="canvas-label">Routt · Travel identity</p>
          {onName ? (
            <input
              value={name}
              onChange={(e) => onName(e.target.value)}
              placeholder="Your name"
              aria-label="Display name"
              className="mt-1 w-full max-w-[12rem] bg-transparent font-display text-2xl font-semibold text-white placeholder:text-white/40 focus:outline-none"
            />
          ) : (
            <p className="mt-1 font-display text-2xl font-semibold">{name || "Traveller"}</p>
          )}
          <p className="mt-1 font-body text-xs text-canvasmuted">
            {stamps.length} {stamps.length === 1 ? "stamp" : "stamps"} · keep exploring
          </p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-skyaccent/15 text-skyaccent">
          <AvatarIcon k={avatar} className="h-6 w-6" />
        </span>
      </div>

      {/* Avatar picker (identity only) */}
      {onAvatar ? (
        <div className="flex flex-wrap gap-1.5 px-5 pt-4">
          {AVATARS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => onAvatar(a.key)}
              aria-pressed={a.key === avatar}
              aria-label={`Avatar ${a.key}`}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                a.key === avatar ? "bg-skyaccent/25 text-skyaccent ring-1 ring-skyaccent/50" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <a.Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </button>
          ))}
        </div>
      ) : null}

      {/* Stamps */}
      <div className="grid grid-cols-3 gap-3 p-5">
        {slots.map((slug, i) => {
          if (!slug) {
            return (
              <div
                key={`empty-${i}`}
                className="flex aspect-square items-center justify-center rounded-full border border-dashed border-white/15 px-2 text-center font-body text-[0.7rem] text-white/30"
              >
                where next?
              </div>
            );
          }
          const isNew = slug === justEarned;
          return (
            <div
              key={slug}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-full border-2 border-skyaccent/60 text-center text-skyaccent ${
                isNew ? "animate-stamp-press" : "-rotate-12"
              }`}
            >
              <Stamp className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              <span className="px-1 font-body text-[0.6rem] font-bold uppercase leading-tight tracking-wide text-white/85">
                {STAMP_NAME[slug] ?? slug.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
