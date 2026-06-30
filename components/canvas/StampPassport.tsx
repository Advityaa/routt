"use client";

/**
 * A playful travel identity — NOT a real passport. Display name + a chosen
 * avatar (emoji) + earned destination stamps. No passport numbers, no scans,
 * no government fields. Stamps press in with a satisfying animation.
 */

const STAMP_META: Record<string, { name: string; flag: string }> = {
  dubai: { name: "DUBAI", flag: "🇦🇪" },
  "abu-dhabi": { name: "ABU DHABI", flag: "🇦🇪" },
  bangkok: { name: "BANGKOK", flag: "🇹🇭" },
  singapore: { name: "SINGAPORE", flag: "🇸🇬" },
  bali: { name: "BALI", flag: "🇮🇩" },
  "kuala-lumpur": { name: "KUALA LUMPUR", flag: "🇲🇾" },
};

const AVATARS = ["✈️", "🌍", "🧳", "🗺️", "🏝️", "🎒"];

export default function StampPassport({
  name,
  avatar,
  stamps,
  justEarned,
  onName,
  onAvatar,
  compact = false,
}: {
  name: string;
  avatar: string;
  stamps: string[];
  justEarned?: string | null;
  onName?: (v: string) => void;
  onAvatar?: (v: string) => void;
  compact?: boolean;
}) {
  // Always show a few empty slots to invite "where next?".
  const slotCount = Math.max(6, Math.ceil((stamps.length + 2) / 3) * 3);
  const slots = Array.from({ length: slotCount }, (_, i) => stamps[i] ?? null);

  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-navy text-white shadow-soft">
      {/* Cover */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.25em] text-white/55">
            Routt · Travel identity
          </p>
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
          <p className="mt-1 font-body text-xs text-white/55">
            {stamps.length} {stamps.length === 1 ? "stamp" : "stamps"} · keep exploring
          </p>
        </div>
        <div className="text-4xl" aria-hidden>
          {avatar || "✈️"}
        </div>
      </div>

      {/* Avatar picker (identity only) */}
      {onAvatar ? (
        <div className="flex flex-wrap gap-1.5 px-5 pt-4">
          {AVATARS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAvatar(a)}
              aria-pressed={a === avatar}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors ${
                a === avatar ? "bg-white/20 ring-1 ring-white/50" : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      ) : null}

      {/* Stamps */}
      <div className={`grid grid-cols-3 gap-3 p-5 ${compact ? "" : "sm:grid-cols-3"}`}>
        {slots.map((slug, i) => {
          if (!slug) {
            return (
              <div
                key={`empty-${i}`}
                className="flex aspect-square items-center justify-center rounded-full border border-dashed border-white/20 font-body text-xs text-white/30"
              >
                where next?
              </div>
            );
          }
          const meta = STAMP_META[slug] ?? { name: slug.toUpperCase(), flag: "📍" };
          const isNew = slug === justEarned;
          return (
            <div
              key={slug}
              className={`flex aspect-square flex-col items-center justify-center rounded-full border-2 border-white/70 text-center ${
                isNew ? "animate-stamp-press" : "-rotate-12"
              }`}
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)" }}
            >
              <span className="text-xl" aria-hidden>
                {meta.flag}
              </span>
              <span className="mt-0.5 px-1 font-body text-[9px] font-bold uppercase leading-tight tracking-wide text-white/85">
                {meta.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
