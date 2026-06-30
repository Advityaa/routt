/**
 * Dynamic destination theming — the reusable layer.
 *
 * Blue is the backbone; each destination contributes only an ACCENT layer
 * (a secondary color + a hero photo + a scrim). The base brand (Routt blue,
 * coral actions, ink, surfaces) never changes. Any component that reads the
 * CSS variables below re-themes for free, so new pages/features inherit this
 * automatically — no per-page theming code.
 *
 * Swapping stock → real user photos later is a DATA change here, nothing else.
 */

export interface DestinationTheme {
  slug: string;
  /** Secondary accent (harmonises with blue; coral stays the action color). */
  accent: string;
  accentDeep: string;
  /** Overlay tint for text legibility over the hero photo. */
  scrim: string;
  /** Hero/card photo. Empty string = no photo (clean brand-blue default). */
  heroImage: string;
  /** Short, human description used for alt text + mood. */
  mood: string;
  credit?: { photographer: string; source: string; url: string };
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=70`;

/** The always-valid base. Accent == Routt blue, no photo. */
export const DEFAULT_THEME: DestinationTheme = {
  slug: "default",
  accent: "#1E6FB8",
  accentDeep: "#13548F",
  scrim: "rgba(10, 24, 40, 0.55)",
  heroImage: "",
  mood: "Routt — first-trip playbooks for Indian travellers",
};

export const DESTINATION_THEMES: Record<string, DestinationTheme> = {
  dubai: {
    slug: "dubai",
    accent: "#C68A2E",
    accentDeep: "#8A5E16",
    scrim: "rgba(28, 18, 6, 0.55)",
    heroImage: unsplash("photo-1748029057835-be96754c6acf"),
    mood: "Desert dunes at golden hour near Dubai",
    credit: { photographer: "Marek Piwnicki", source: "Unsplash", url: "https://unsplash.com/photos/golden-hour-illuminates-desert-dunes-and-mountains-kgJw1yur2Js" },
  },
  bangkok: {
    slug: "bangkok",
    accent: "#D9663B",
    accentDeep: "#A23F1C",
    scrim: "rgba(30, 14, 8, 0.55)",
    heroImage: unsplash("photo-1762950297550-1d8d7cce12ae"),
    mood: "Wat Arun temple at sunset over the Bangkok skyline",
    credit: { photographer: "Haley Hong", source: "Unsplash", url: "https://unsplash.com/photos/wat-arun-temple-illuminated-at-sunset-with-colorful-sky-MKVGJ4d3E6c" },
  },
  singapore: {
    slug: "singapore",
    accent: "#1FA2B8",
    accentDeep: "#0E6E7E",
    scrim: "rgba(6, 24, 30, 0.55)",
    heroImage: unsplash("photo-1760377964915-97c016103f44"),
    mood: "The modern Singapore skyline with Gardens by the Bay",
    credit: { photographer: "Florian Delée", source: "Unsplash", url: "https://unsplash.com/photos/modern-singapore-skyline-with-gardens-by-the-bay-buY6GF0aUSY" },
  },
  bali: {
    slug: "bali",
    accent: "#2E9E6B",
    accentDeep: "#1B6E48",
    scrim: "rgba(8, 26, 16, 0.55)",
    heroImage: unsplash("photo-1746106424334-a0f652d81cde"),
    mood: "Lush green rice terraces in Bali",
    credit: { photographer: "Matthew Stephenson", source: "Unsplash", url: "https://unsplash.com/photos/rice-terraces-nestled-among-lush-tropical-greenery-FlQeHeTPClU" },
  },
  "abu-dhabi": {
    slug: "abu-dhabi",
    accent: "#C19A5B",
    accentDeep: "#8A6B33",
    scrim: "rgba(24, 20, 10, 0.55)",
    heroImage: unsplash("photo-1741204472540-e213116cb3ef"),
    mood: "The Sheikh Zayed Grand Mosque in Abu Dhabi",
    credit: { photographer: "Nick Fewings", source: "Unsplash", url: "https://unsplash.com/photos/the-sheikh-zayed-mosque-is-a-beautiful-landmark-UpfwRvJAsI4" },
  },
  "kuala-lumpur": {
    slug: "kuala-lumpur",
    accent: "#1E9E8C",
    accentDeep: "#0F6E61",
    scrim: "rgba(6, 26, 24, 0.55)",
    heroImage: unsplash("photo-1764866557865-1f4e4060211f"),
    mood: "The Petronas Towers lit up over the Kuala Lumpur skyline",
    credit: { photographer: "Alim", source: "Unsplash", url: "https://unsplash.com/photos/twin-towers-illuminated-against-the-night-sky-TDZKKlsJwCk" },
  },
};

/** Theme for a slug, always falling back to the valid blue default. */
export function getTheme(slug?: string | null): DestinationTheme {
  if (!slug) return DEFAULT_THEME;
  return DESTINATION_THEMES[slug] ?? DEFAULT_THEME;
}

/** CSS custom properties for a theme — spread onto any wrapper's `style`. */
export function themeVars(theme: DestinationTheme): React.CSSProperties {
  return {
    ["--accent" as string]: theme.accent,
    ["--accent-deep" as string]: theme.accentDeep,
    ["--scrim" as string]: theme.scrim,
  };
}

/** All themes that carry a photo credit (for the credits list). */
export function allCredits(): DestinationTheme[] {
  return Object.values(DESTINATION_THEMES).filter((t) => t.credit);
}
