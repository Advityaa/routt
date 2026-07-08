import type { Config } from "tailwindcss";

/**
 * Routt v1 — Tailwind config.
 * Colors map to role-based CSS variables defined in app/globals.css, so every
 * utility (bg-canvas, text-fg, border-line, text-verdict-good…) auto-themes
 * between dark (default) and light. Mobile-first: design at 390px, scale up.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        surface: "var(--surface)",
        elevate: "var(--elevate)",
        line: "var(--line)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-deep": "var(--accent-deep)",
        "accent-fill": "var(--accent-fill)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        verdict: {
          good: "var(--verdict-good)",
          fading: "var(--verdict-fading)",
          trap: "var(--verdict-trap)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Mobile-first scale. Eyebrow = the uppercase tracked-out labels.
        eyebrow: ["11px", { lineHeight: "1", letterSpacing: "0.14em" }],
        "display-sm": ["22px", { lineHeight: "1.12", letterSpacing: "-0.01em" }],
        display: ["28px", { lineHeight: "1.06", letterSpacing: "-0.015em" }],
        "display-lg": ["40px", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        badge: "8px",
        card: "16px",
        pill: "999px",
      },
      boxShadow: {
        // Only meaningful in light mode; dark relies on borders, not shadows.
        card: "0 1px 2px rgba(20,32,31,0.04), 0 12px 28px rgba(20,32,31,0.06)",
      },
      keyframes: {
        // Feed items rise in when the list re-ranks (category/time change).
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // The one sanctioned badge micro-interaction: a subtle reveal pop.
        "badge-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        rise: "rise 0.35s ease both",
        "badge-in": "badge-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
