/**
 * BusyChart — a 24-bar visualization of a place's relative busyness, with the
 * current hour highlighted. Purely presentational.
 */
export interface BusyChartProps {
  busyByHour: number[];
  currentHour: number;
}

export default function BusyChart({ busyByHour, currentHour }: BusyChartProps) {
  const hour = ((Math.round(currentHour) % 24) + 24) % 24;
  const max = Math.max(...busyByHour, 0.001);

  return (
    <div>
      <div className="flex h-16 items-end gap-[2px]" aria-hidden>
        {busyByHour.map((v, h) => (
          <div
            key={h}
            style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            className={`flex-1 rounded-[2px] ${h === hour ? "bg-fg" : "bg-line"}`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-faint">
        <span>12a</span>
        <span>6a</span>
        <span>12p</span>
        <span>6p</span>
        <span>12a</span>
      </div>
    </div>
  );
}
