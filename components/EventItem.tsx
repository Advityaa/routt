/**
 * EventItem — one row in "this week near you". Mono date block (evidence/data
 * feel) + plainspoken name and venue. Presentational for now.
 */
export interface EventItemProps {
  day: string; // e.g. "TUE"
  date: string; // e.g. "02"
  name: string;
  venue: string;
  tag?: string; // e.g. "Live music"
  when?: string; // e.g. "21:00"
}

export default function EventItem({ day, date, name, venue, tag, when }: EventItemProps) {
  return (
    <article className="flex items-center gap-3.5 rounded-card border border-line bg-surface px-4 py-3.5">
      <div className="relative flex w-11 shrink-0 flex-col items-center overflow-hidden border border-line bg-surface py-1.5 shadow-[0_3px_8px_-4px_rgba(28,26,22,0.25)]" style={{ borderRadius: "6px 6px 8px 6px" }}>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted">{day}</span>
        <span className="font-display text-[19px] font-medium leading-none text-fg tabular-nums">{date}</span>
        <span aria-hidden className="absolute -bottom-[7px] -right-[7px] h-[14px] w-[14px] rotate-45 bg-elevate shadow-[-1px_-1px_3px_rgba(28,26,22,0.18)]" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-[16px] font-semibold text-fg">{name}</h3>
        <p className="mt-0.5 truncate font-mono text-[12px] text-muted">
          {venue}
          {when ? <span className="text-faint"> · {when}</span> : null}
        </p>
      </div>

      {tag ? (
        <span className="shrink-0 rounded-pill border border-line px-2.5 py-1 text-[11px] font-medium text-muted">
          {tag}
        </span>
      ) : null}
    </article>
  );
}
