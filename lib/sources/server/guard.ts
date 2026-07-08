/**
 * Import this at the top of any module that reads API keys or is otherwise
 * server-only. If it ever ends up in a browser bundle, this throws loudly at
 * runtime. (We'd use the `server-only` package for a build-time guarantee, but
 * it isn't installed; keys are also kept out of the client by construction —
 * the client never imports these modules, it calls /api/places instead.)
 */
if (typeof window !== "undefined") {
  throw new Error(
    "server-only module imported in the browser — API keys must never reach the client",
  );
}
export {};
