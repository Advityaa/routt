import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.mdx",
  ],
  theme: {
    extend: {
      colors: {
        // Shades of blue only. Coral is for buttons only.
        primary: "#1E6FB8",
        navy: "#13548F",
        fill: "#DEEBF7",
        hairline: "#D6E3F0",
        bg: "#FAFCFE",
        ink: "#152A3E",
        coral: "#F0633C",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-schibsted)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "22px",
        pill: "100px",
      },
      boxShadow: {
        // Soft shadows only — no heavy effects.
        soft: "0 1px 2px rgba(19, 84, 143, 0.04), 0 8px 24px rgba(19, 84, 143, 0.06)",
        lift: "0 2px 4px rgba(19, 84, 143, 0.06), 0 16px 40px rgba(19, 84, 143, 0.12)",
        nav: "0 1px 0 rgba(214, 227, 240, 1)",
      },
      keyframes: {
        "fade-rise": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "ambient": {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "0.75", transform: "scale(1.05)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "ken-burns": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.12)" },
        },
      },
      animation: {
        "fade-rise": "fade-rise 0.5s ease both",
        "ambient": "ambient 12s ease-in-out infinite",
        "fade-in": "fade-in 0.45s ease both",
        "ken-burns": "ken-burns 22s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
