/**
 * Source configuration flags.
 *
 * USE_MOCK: when true (default), every adapter returns reshaped mock data so the
 * whole multi-source pipeline runs offline today. When "false", adapters will
 * call real APIs (wired in later prompts) — until then they throw a clear error.
 *
 * Note: real API calls must run SERVER-SIDE (keys never ship to the browser —
 * see README). `process.env.USE_MOCK` is read at call time; in a client bundle
 * it's undefined, which correctly defaults to mock.
 */
// Client reads NEXT_PUBLIC_USE_MOCK (only NEXT_PUBLIC_* vars reach the browser);
// server falls back to USE_MOCK. Either set to "false" to go live. Default: mock.
export const USE_MOCK =
  (process.env.NEXT_PUBLIC_USE_MOCK ?? process.env.USE_MOCK ?? "true") !== "false";
