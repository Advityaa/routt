import { computeForex, FOREX_DEFAULTS, inr, round50 } from "@/lib/forex";

/**
 * "You'll save" tile — the real forex savings number from the shared forex
 * math (same logic as the full calculator), in the dark canvas style.
 */
export default function SavingsTile() {
  const { savings } = computeForex(FOREX_DEFAULTS);
  return (
    <div className="canvas-tile p-6">
      <p className="canvas-label">You&apos;ll save on this trip</p>
      <p className="mt-1.5 font-display text-[2.4rem] font-semibold leading-none text-skyaccent">
        ≈ {inr(round50(savings))}
      </p>
      <p className="mt-2 font-body text-sm text-canvasmuted">
        with a zero-markup forex card vs a normal card on ~{inr(FOREX_DEFAULTS.spend)} spend.
        Set up your card in the countdown.
      </p>
    </div>
  );
}
