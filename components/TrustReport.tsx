import type { PlaceSourceRecord, SourceName } from "@/lib/types";

/**
 * TrustReport — "How we checked this". The receipts behind the verdict: what
 * each source actually reported, plus a plain-language read on whether they
 * agree. Voice rule: show the work, admit uncertainty, never overclaim.
 * Disagreement is surfaced as useful information, not hidden.
 */

const SOURCE_LABEL: Record<SourceName, string> = {
  google: "Google",
  foursquare: "Foursquare",
  reddit: "Reddit",
};

const fmtCount = (n: number) => n.toLocaleString("en-US");

/** One source's stat, in its own native terms. */
function receipt(s: PlaceSourceRecord): string {
  if (s.source === "reddit") {
    return `${fmtCount(s.reviewCount)} mention${s.reviewCount === 1 ? "" : "s"} by locals`;
  }
  if (s.ratingScaleMax === 10) {
    return `${s.rating.toFixed(1)}/10 · ${fmtCount(s.reviewCount)} ratings`;
  }
  return `${s.rating.toFixed(1)}★ · ${fmtCount(s.reviewCount)} reviews`;
}

/** Normalized (0–5) rating for comparing sources when they disagree. */
const norm = (s: PlaceSourceRecord) => (s.rating / s.ratingScaleMax) * 5;

// Agreement ≥ this → "sources agree". Below → we say they don't, and show how.
const AGREE_FLOOR = 0.7;
// Match confidence below this (multi-source) → admit the merge is "likely", not certain.
const SURE_MATCH_FLOOR = 0.8;

function listNames(sources: PlaceSourceRecord[]): string {
  const names = sources.map((s) => SOURCE_LABEL[s.source]);
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** The plain-language agreement summary. Exported for reuse/testing. */
export function agreementSummary(
  sources: PlaceSourceRecord[],
  agreement: number,
): { text: string; tone: "good" | "warn" | "neutral" } {
  if (sources.length <= 1) {
    const name = sources.length ? SOURCE_LABEL[sources[0].source] : "one source";
    return { text: `Only found on ${name} — less cross-checked than we'd like.`, tone: "neutral" };
  }
  if (agreement >= AGREE_FLOOR) {
    return { text: `Sources agree — consistent across ${listNames(sources)}.`, tone: "good" };
  }
  // Disagreement: name the outliers honestly.
  const ranked = [...sources].sort((a, b) => norm(b) - norm(a));
  const hi = ranked[0];
  const lo = ranked[ranked.length - 1];
  const loPhrase =
    lo.source === "reddit"
      ? "locals on Reddit are much cooler on it"
      : `${SOURCE_LABEL[lo.source]} rates it well below that`;
  return {
    text: `Sources disagree — rated high on ${SOURCE_LABEL[hi.source]}, but ${loPhrase}. Worth knowing before you go.`,
    tone: "warn",
  };
}

export interface TrustReportProps {
  sources: PlaceSourceRecord[];
  crossSourceAgreement: number;
  matchConfidence?: number;
}

export default function TrustReport({
  sources,
  crossSourceAgreement,
  matchConfidence = 1,
}: TrustReportProps) {
  if (!sources.length) return null;
  const summary = agreementSummary(sources, crossSourceAgreement);
  const uncertainMatch = sources.length > 1 && matchConfidence < SURE_MATCH_FLOOR;

  return (
    <div className="rounded-card border border-line bg-surface p-4">
      {/* The receipts */}
      <ul className="flex flex-col gap-2">
        {sources.map((s) => (
          <li key={s.source} className="flex items-baseline justify-between gap-4">
            <span className="font-sans text-[13.5px] font-semibold text-fg">
              {SOURCE_LABEL[s.source]}
            </span>
            <span className="text-right font-mono text-[12.5px] text-muted">{receipt(s)}</span>
          </li>
        ))}
      </ul>

      {/* Plain-language agreement read */}
      <p
        className="mt-3 border-t border-line pt-3 text-[13.5px] leading-relaxed"
        style={{
          color:
            summary.tone === "good"
              ? "var(--verdict-good)"
              : summary.tone === "warn"
                ? "var(--verdict-fading)"
                : "var(--muted)",
        }}
      >
        {summary.text}
      </p>

      {/* Entity-resolution honesty: admit when the merge itself is only "likely". */}
      {uncertainMatch ? (
        <p className="mt-1.5 font-mono text-[11.5px] leading-snug text-faint">
          Listings matched across sources look like the same place, but not identically — treat
          the cross-check as likely, not certain.
        </p>
      ) : null}
    </div>
  );
}
