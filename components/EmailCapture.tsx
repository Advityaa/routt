"use client";

import { track } from "@vercel/analytics";
import { useState } from "react";

/**
 * Phase-1 email capture. No database yet — we just record the intent as an
 * analytics event so we can size demand before wiring a real list.
 */
export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    track("email_signup");
    setSubmitted(true);
  };

  return (
    <div
      id="email"
      className="scroll-mt-24 rounded-card border border-hairline bg-navy px-6 py-10 text-center shadow-lift sm:px-12 sm:py-14"
    >
      <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
        Get the next playbook first
      </h2>
      <p className="mx-auto mt-3 max-w-md font-body text-base text-white/70">
        New destinations, fresh eSIM and forex picks, and the mistakes to skip —
        straight to your inbox before your trip.
      </p>

      {submitted ? (
        <p className="mx-auto mt-8 max-w-md rounded-card bg-white/10 px-5 py-4 font-body text-base text-white">
          You&apos;re on the list. We&apos;ll be in touch before your next trip. ✈️
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            aria-label="Email address"
            className="w-full rounded-pill border border-white/15 bg-white/10 px-5 py-3 font-body text-base text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-pill bg-coral px-7 py-3 font-body text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.03]"
          >
            Notify me
          </button>
        </form>
      )}
    </div>
  );
}
