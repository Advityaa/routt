/**
 * Shared forex-savings math — the single source of truth used by both the full
 * ForexCalculator and the Canvas savings tile, so they can never drift.
 * Transparent estimate on the user's own inputs; never a specific bank's fee.
 */

export interface ForexInputs {
  spend: number;
  atm: number;
  markupPct: number;
  gstPct: number;
  atmFlatNormal: number;
  atmFlatZero: number;
}

export const FOREX_DEFAULTS: ForexInputs = {
  spend: 50_000,
  atm: 10_000,
  markupPct: 3.5,
  gstPct: 18,
  atmFlatNormal: 500,
  atmFlatZero: 150,
};

export interface ForexResult {
  spendMarkup: number;
  normalAtm: number;
  normalTotal: number;
  zeroTotal: number;
  savings: number;
}

export function computeForex(i: ForexInputs): ForexResult {
  const spendMarkup = i.spend * (i.markupPct / 100) * (1 + i.gstPct / 100);
  const atmMarkup = i.atm * (i.markupPct / 100);
  const normalAtm = atmMarkup + i.atmFlatNormal;
  const normalTotal = spendMarkup + normalAtm;
  const zeroTotal = i.atmFlatZero;
  return {
    spendMarkup,
    normalAtm,
    normalTotal,
    zeroTotal,
    savings: Math.max(0, normalTotal - zeroTotal),
  };
}

export const round50 = (n: number) => Math.round(n / 50) * 50;
export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
