"use client";

import { useEffect, useState } from "react";
import { Check, Star } from "lucide-react";

/**
 * First-party UGC capture on the venue detail screen — the moat's intake pipe.
 * 1-tap quick verdict, star rating, local/visitor toggle, tip, fairness price.
 * Auth-lite: an anonymous id in localStorage. Honest states: shows true report
 * counts; photos/tips queue for moderation before display.
 */

const ANON_KEY = "routt.anonId";
const HELPED_KEY = "routt.helpedCount";
const anonId = () => {
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = `anon-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
};

interface Signals {
  verdict_state: string;
  review_count_90d: number;
  local_pct: number | null;
}
interface Tip { id: string; text: string; handle: string; is_local: boolean }

export default function ContributeCard({ gersId, venueName }: { gersId: string; venueName: string }) {
  const [signals, setSignals] = useState<Signals | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [quick, setQuick] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [isLocal, setIsLocal] = useState(false);
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [helped, setHelped] = useState(0);

  const [listing, setListing] = useState<"established" | "limited" | null>(null);

  useEffect(() => {
    setHelped(Number(localStorage.getItem(HELPED_KEY) ?? 0));
    fetch(`/api/contribute?gers_id=${encodeURIComponent(gersId)}`)
      .then((r) => r.json())
      .then((d) => {
        setSignals(d.signals);
        setTips(d.tips ?? []);
      })
      .catch(() => {});
    // Listing-quality hint (Overture confidence/completeness) — metadata, NOT a verdict.
    fetch(`/api/venues?id=${encodeURIComponent(gersId)}`)
      .then((r) => r.json())
      .then((d) => setListing(d.venues?.[0]?.listing_quality ?? null))
      .catch(() => {});
  }, [gersId]);

  async function submit() {
    if (!quick && !rating && !text.trim() && !price.trim()) return;
    setStatus("sending");
    const res = await fetch("/api/contribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gers_id: gersId,
        user_id: anonId(),
        quick: quick ?? undefined,
        rating: rating || undefined,
        text: text.trim() || undefined,
        is_local: isLocal,
        price_paid: price.trim() ? Number(price) : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStatus("error");
      setMessage(data.error ?? "could not save");
      return;
    }
    const n = helped + 1;
    localStorage.setItem(HELPED_KEY, String(n));
    setHelped(n);
    setSignals(data.signals);
    setStatus("done");
  }

  const count = signals?.review_count_90d ?? 0;

  return (
    <section className="mt-8">
      <h2 className="text-eyebrow uppercase text-muted">Traveller reports</h2>
      <div className="mt-3 rounded-card border border-line bg-surface p-4">
        {/* Honest state line — true counts only */}
        <p className="text-[13.5px] text-muted">
          {count === 0
            ? "Not rated yet — be the first to report."
            : `${count} traveller report${count === 1 ? "" : "s"} in the last 90 days${
                signals?.local_pct != null ? ` · ${signals.local_pct}% from locals` : ""
              }`}
        </p>
        {listing ? (
          <p className="mt-1 font-mono text-[10.5px] text-faint">
            {listing === "established"
              ? "Established listing — complete, high-confidence map data"
              : "Limited listing info"}{" "}
            · listing metadata, not a rating
          </p>
        ) : null}

        {status === "done" ? (
          <div className="mt-3 flex items-center gap-2 rounded-badge bg-elevate p-3 text-[13.5px] text-fg">
            <Check size={15} className="text-accent" aria-hidden />
            <span>
              Thanks — your report is in.{" "}
              <span className="text-muted">You&apos;ve helped {helped} traveller{helped === 1 ? "" : "s"}.</span>
            </span>
          </div>
        ) : (
          <>
            {/* 1-tap quick verdict */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["still-good", "Still good"],
                ["not-what-it-was", "Not what it was"],
                ["closed", "Closed"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setQuick(quick === value ? null : value)}
                  className={`h-9 rounded-pill border px-3.5 text-[13px] font-semibold transition ${
                    quick === value ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Stars + local toggle */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(rating === n ? 0 : n)} aria-label={`${n} stars`}>
                    <Star
                      size={20}
                      strokeWidth={1.5}
                      className={n <= rating ? "fill-accent text-accent" : "text-faint"}
                    />
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[12.5px] text-muted">
                <input type="checkbox" checked={isLocal} onChange={(e) => setIsLocal(e.target.checked)} className="accent-[var(--accent)]" />
                I live here
              </label>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={400}
              placeholder={`Quick tip for travellers about ${venueName}? (optional)`}
              className="mt-3 w-full resize-none rounded-badge border border-line bg-elevate px-3 py-2 text-[13.5px] text-fg placeholder:text-faint focus:border-fg/40 focus:outline-none"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="What did you pay? ฿ (optional)"
                className="h-9 min-w-0 flex-1 rounded-pill border border-line bg-elevate px-3.5 text-[13px] text-fg placeholder:text-faint focus:border-fg/40 focus:outline-none"
              />
              <button
                onClick={submit}
                disabled={status === "sending" || (!quick && !rating && !text.trim() && !price.trim())}
                className="h-9 shrink-0 rounded-pill bg-accent px-4 text-[13px] font-semibold text-accent-ink transition hover:opacity-90 disabled:bg-elevate disabled:text-faint"
              >
                {status === "sending" ? "Sending…" : "Send report"}
              </button>
            </div>
            {status === "error" ? <p className="mt-2 text-[12px] text-verdict-trap">{message}</p> : null}
            <p className="mt-2 font-mono text-[10.5px] text-faint">
              First-party to Routt · shown as first name only · photos & tips reviewed before display
            </p>
          </>
        )}

        {/* Moderated tips with report button */}
        {tips.length > 0 ? (
          <ul className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
            {tips.map((t) => (
              <li key={t.id} className="text-[13px] leading-relaxed text-fg">
                “{t.text}” <span className="text-muted">— {t.handle}{t.is_local ? " · local" : ""}</span>{" "}
                <button
                  onClick={() => fetch("/api/contribute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", review_id: t.id }) }).then(() => setTips(tips.filter((x) => x.id !== t.id)))}
                  className="font-mono text-[10.5px] text-faint underline underline-offset-2 hover:text-fg"
                >
                  report
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
