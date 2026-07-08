/**
 * GettingThereBack — v1 rule-based transit intelligence. NOT live transit.
 *
 * Deliberately structured as labeled rows + a single time-aware note so it can
 * later be wired to real transit/rideshare APIs without touching the layout.
 * The rule that matters today: Bangkok BTS/MRT run ~06:00–24:00. Near closing we
 * flag "last trains soon"; after it we warn to budget for a Grab back.
 */
export interface GettingThereBackProps {
  distanceMeters: number;
  hour: number; // 0–23, the user's current local hour
}

// Bangkok BTS/MRT: first trains ~06:00, last ~24:00. Hour 23 is "winding down".
type TransitStatus = "running" | "closing" | "stopped";
function transitStatus(hour: number): TransitStatus {
  if (hour >= 6 && hour <= 22) return "running";
  if (hour === 23) return "closing";
  return "stopped"; // 0–5
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-eyebrow uppercase text-muted">{label}</span>
      <span className="text-right font-mono text-[13px] text-fg">{value}</span>
    </div>
  );
}

export default function GettingThereBack({ distanceMeters, hour }: GettingThereBackProps) {
  const h = ((Math.round(hour) % 24) + 24) % 24;
  const km = distanceMeters / 1000;

  const walkable = distanceMeters <= 1200;
  const walkMin = Math.max(1, Math.round(distanceMeters / 80)); // ~80 m/min
  const rideMin = Math.round(km * 4) + 5;

  const status = transitStatus(h);
  const grabFare = Math.max(60, Math.round((55 + km * 28) / 10) * 10);

  const distanceLabel =
    distanceMeters < 1000 ? `${distanceMeters} m away` : `${km.toFixed(1)} km away`;
  const gettingThere = walkable ? `~${walkMin} min walk` : `BTS / taxi, ~${rideMin} min`;

  const note =
    status === "running"
      ? "BTS & MRT running now — easy ride back."
      : status === "closing"
        ? `Last trains around midnight — head off soon, or budget a Grab back, ~฿${grabFare}.`
        : `Metro's stopped for the night — budget for a Grab back, ~฿${grabFare}.`;

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <Row label="Distance" value={distanceLabel} />
      <Row label="Getting there" value={gettingThere} />

      <div
        className="mt-1 rounded-badge border p-3 font-mono text-[12.5px] leading-relaxed"
        style={
          status === "running"
            ? { borderColor: "var(--line)", color: "var(--muted)" }
            : {
                color: "var(--verdict-fading)",
                borderColor: "color-mix(in srgb, var(--verdict-fading) 36%, transparent)",
                background: "color-mix(in srgb, var(--verdict-fading) 12%, var(--surface))",
              }
        }
      >
        {note}
      </div>
    </div>
  );
}
