"use client";

import { useId, useState } from "react";
import AffiliateButton from "@/components/AffiliateButton";
import type { PartnerId } from "@/lib/affiliate";
import { computeForex, inr, round50 } from "@/lib/forex";

/**
 * Forex savings estimator. A transparent calculation on the user's OWN inputs:
 * roughly how much a zero-markup forex card saves vs a normal Indian card.
 * Shares its math with the Canvas savings tile via lib/forex.
 *
 * Honesty rules: every assumption is visible + editable (no hidden magic
 * number), and it's framed as an estimate — never a specific bank's exact fee.
 */

function numFromInput(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export default function ForexCalculator({
  partnerId = "niyo",
  destination,
}: {
  partnerId?: PartnerId;
  destination: string;
}) {
  // User inputs
  const [spend, setSpend] = useState(50_000);
  const [atm, setAtm] = useState(10_000);

  // Editable assumptions (visible by default — the credibility is in seeing them)
  const [markupPct, setMarkupPct] = useState(3.5);
  const [gstPct, setGstPct] = useState(18);
  const [atmFlatNormal, setAtmFlatNormal] = useState(500);
  const [atmFlatZero, setAtmFlatZero] = useState(150);

  // Live math — recomputed every render, no effects, no reload.
  const { spendMarkup, normalAtm, normalTotal, zeroTotal, savings } = computeForex({
    spend,
    atm,
    markupPct,
    gstPct,
    atmFlatNormal,
    atmFlatZero,
  });

  const uid = useId();

  return (
    <div className="mt-3 rounded-card border border-hairline bg-fill/30 p-4">
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
        Forex savings calculator · estimate
      </p>

      {/* Headline */}
      <p className="mt-2 font-display text-2xl font-semibold leading-tight text-ink">
        You&apos;d save roughly{" "}
        <span className="text-primary">{inr(round50(savings))}</span> on this trip.
      </p>

      {/* Inputs */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id={`${uid}-spend`}
          label="Card spend abroad"
          value={spend}
          onChange={setSpend}
          step={5_000}
          prefix="₹"
        />
        <Field
          id={`${uid}-atm`}
          label="ATM cash withdrawal"
          value={atm}
          onChange={setAtm}
          step={1_000}
          prefix="₹"
        />
      </div>

      {/* Visible, editable assumptions */}
      <details open className="mt-3 rounded-xl border border-hairline bg-white px-3 py-2">
        <summary className="cursor-pointer font-body text-sm font-semibold text-ink">
          Assumptions (tap to adjust)
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field id={`${uid}-markup`} label="Normal card markup" value={markupPct} onChange={setMarkupPct} step={0.5} suffix="%" />
          <Field id={`${uid}-gst`} label="GST on markup" value={gstPct} onChange={setGstPct} step={1} suffix="%" />
          <Field id={`${uid}-atmn`} label="Normal ATM flat fee" value={atmFlatNormal} onChange={setAtmFlatNormal} step={50} prefix="₹" />
          <Field id={`${uid}-atmz`} label="Zero-markup ATM fee" value={atmFlatZero} onChange={setAtmFlatZero} step={50} prefix="₹" />
        </div>
        <p className="mt-2 font-body text-xs text-ink/45">
          Zero-markup card: 0% markup on spend. GST applies to the card-spend
          markup only.
        </p>
      </details>

      {/* Comparison */}
      <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 font-body text-sm">
        <span className="text-ink/50" />
        <span className="text-right text-xs font-semibold uppercase tracking-wide text-ink/50">
          Normal
        </span>
        <span className="text-right text-xs font-semibold uppercase tracking-wide text-primary">
          Zero-markup
        </span>

        <span className="text-ink/70">Spend markup</span>
        <span className="text-right tabular-nums text-ink/80">{inr(round50(spendMarkup))}</span>
        <span className="text-right tabular-nums text-ink/80">{inr(0)}</span>

        <span className="text-ink/70">ATM fees</span>
        <span className="text-right tabular-nums text-ink/80">{inr(round50(normalAtm))}</span>
        <span className="text-right tabular-nums text-ink/80">{inr(round50(zeroTotal))}</span>

        <span className="border-t border-hairline pt-2 font-semibold text-ink">Total cost</span>
        <span className="border-t border-hairline pt-2 text-right font-semibold tabular-nums text-ink">{inr(round50(normalTotal))}</span>
        <span className="border-t border-hairline pt-2 text-right font-semibold tabular-nums text-primary">{inr(round50(zeroTotal))}</span>
      </div>

      <p className="mt-3 font-body text-xs leading-relaxed text-ink/50">
        Estimate based on the assumptions above — actual fees vary by card and
        bank. Check current terms before you choose.
      </p>

      <AffiliateButton
        partner={partnerId}
        destination={destination}
        label="Compare zero-markup forex cards →"
      />
    </div>
  );
}

/** Compact labelled number input with optional ₹ prefix or % suffix. */
function Field({
  id,
  label,
  value,
  onChange,
  step,
  prefix,
  suffix,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-body text-xs font-medium text-ink/60">
        {label}
      </label>
      <div className="mt-1 flex min-h-[44px] items-center rounded-xl border border-hairline bg-white px-3">
        {prefix ? <span className="font-body text-sm text-ink/40">{prefix}</span> : null}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(numFromInput(e.target.value))}
          className="h-11 w-full min-w-0 bg-transparent px-1.5 font-body text-base text-ink focus:outline-none"
        />
        {suffix ? <span className="font-body text-sm text-ink/40">{suffix}</span> : null}
      </div>
    </div>
  );
}
