"use client";
/** World-entry transition: a soft rise/fade on every route change — "entering
 *  a new space". The global prefers-reduced-motion kill-switch disables it. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
