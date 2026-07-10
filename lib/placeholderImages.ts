import type { Category } from "./types";

/**
 * Central mock-image layer — DETERMINISTIC and PLAUSIBLE (prototype-phase).
 * Images are keyed by REGION (active city's country) + CATEGORY/THEME, so a
 * Bangkok card only ever shows Thailand-plausible or category-generic imagery —
 * never another country's landmark. Same id → same image, every render.
 * Swap to real photos later by changing getVenueImage only.
 */
const U = (id: string, w = 500) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

// Category-generic, landmark-free pools (safe anywhere).
const GENERIC: Record<string, string[]> = {
  eat: ["photo-1504674900247-0877df9cc836","photo-1512058564366-18510be2db19","photo-1526318896980-cf78c088247c","photo-1476224203421-9ac39bcb3327","photo-1540189549336-e6e99c3679fe"].map((x)=>U(x)),
  cafe: ["photo-1509042239860-f550ce710b93","photo-1495474472287-4d71bcdd2085","photo-1447933601403-0c6688de566e"].map((x)=>U(x)),
  drink: ["photo-1514362545857-3bc16c4c7d1b","photo-1470337458703-46ad1756a187","photo-1551024709-8f23befc6f87","photo-1536935338788-846bb9981813"].map((x)=>U(x)),
  nightlife: ["photo-1493225457124-a3eb161ffa5f","photo-1501281668745-f7f57925c3b4","photo-1470229722913-7c0e2dbbafd3"].map((x)=>U(x)),
  see: ["photo-1507525428034-b723cf961d3e","photo-1476514525535-07fb3b4ae5f1","photo-1500835556837-99ac94a94552"].map((x)=>U(x)),
  shop: ["photo-1441986300917-64674bd600d8","photo-1472851294608-062f824d29cc","photo-1555529669-e69e7aa0ba9a"].map((x)=>U(x)),
  water: ["photo-1507525428034-b723cf961d3e","photo-1544551763-46a013bb70d5","photo-1530053969600-caed2596d242"].map((x)=>U(x)),
  outdoors: ["photo-1501555088652-021faa106b9b","photo-1533692328991-08159ff19fca","photo-1476514525535-07fb3b4ae5f1"].map((x)=>U(x)),
};

// Region pools — verified-plausible imagery for the country (local CC assets for TH).
const REGION: Record<string, Partial<Record<string, string[]>>> = {
  TH: {
    eat: ["/mock-photos/eat-thip-grand-padthai.jpg","/mock-photos/eat-jok-prince.jpg", U("photo-1512058564366-18510be2db19")],
    see: ["/mock-photos/see-loha-prasat.jpg","/mock-photos/see-golden-viewpoint.jpg","/mock-photos/see-benjakitti-park.jpg", U("photo-1508009603885-50cf7c579365")],
    shop: ["/mock-photos/shop-or-tor-kor.jpg", U("photo-1441986300917-64674bd600d8")],
    water: [U("photo-1508009603885-50cf7c579365"), U("photo-1544551763-46a013bb70d5")],
  },
  AE: {
    see: [U("photo-1512453979798-5ea266f8880c"), U("photo-1518684079-3c830dcef090")],
    outdoors: [U("photo-1451337516015-6b6e9a44a8a3")],
    water: [U("photo-1544551763-46a013bb70d5")],
  },
};

const HINTS: [RegExp, string][] = [
  [/snorkel|scuba|dive|kayak|jet ?ski|beach|island|sea|boat|marina/i, "water"],
  [/music|concert|club|night|dj|party|jazz/i, "nightlife"],
  [/cafe|coffee|bakery/i, "cafe"],
  [/desert|safari|hik|trek|balloon|outdoor|surf|climb/i, "outdoors"],
];

function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function activeCountry(): string {
  try { return (localStorage.getItem("routt.activeCity") ?? "bangkok") === "dubai" ? "AE" : localStorage.getItem("routt.activeCity") === "singapore" ? "SG" : "TH"; } catch { return "TH"; }
}

/** Deterministic, region+category-plausible placeholder. `hint` (title/type)
 *  refines the theme (snorkelling → water, jazz → nightlife …). */
export function getVenueImage(category: Category | string, id: string, hint?: string): string {
  let theme: string = category;
  for (const [re, t] of HINTS) if (hint && re.test(hint)) { theme = t; break; }
  const region = REGION[activeCountry()] ?? {};
  const pool = [...(region[theme] ?? []), ...(GENERIC[theme] ?? GENERIC.see)];
  return pool[hash(id) % pool.length];
}

export const HERO_AMBIENT = [U("photo-1508009603885-50cf7c579365", 900), U("photo-1512453979798-5ea266f8880c", 900), U("photo-1525625293386-3f8f99389edd", 900)];
export function getHeroImage(hour: number): string { return HERO_AMBIENT[hour % HERO_AMBIENT.length]; }
