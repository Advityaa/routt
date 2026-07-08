import type { Category } from "./types";
/**
 * PROTOTYPE-PHASE placeholder photography (per design handoff): curated
 * Unsplash stock, assigned DETERMINISTICALLY by hashing the venue id — same
 * venue, same photo, every render. Swap to real photos later by changing
 * getVenueImage only. NOT for shipping as if depicting a specific business.
 */
const U = (id: string, w = 400) => `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;
const LIB: Record<Category, string[]> = {
  eat: ["photo-1504674900247-0877df9cc836","photo-1559847844-5315695dadae","photo-1466637574441-749b8f19452f","photo-1512058564366-18510be2db19","photo-1569718212165-3a8278d5f624","photo-1526318896980-cf78c088247c","photo-1476224203421-9ac39bcb3327","photo-1540189549336-e6e99c3679fe"].map((x)=>U(x)),
  drink: ["photo-1514362545857-3bc16c4c7d1b","photo-1544145945-f90425340c7e","photo-1470337458703-46ad1756a187","photo-1551024709-8f23befc6f87","photo-1536935338788-846bb9981813","photo-1572116469696-31de0f17cc34","photo-1551538827-9c037cb4f32a","photo-1574096079513-d8259312b785"].map((x)=>U(x)),
  shop: ["photo-1441986300917-64674bd600d8","photo-1472851294608-062f824d29cc","photo-1555529669-e69e7aa0ba9a","photo-1567401893414-76b7b1e5a7a5","photo-1534452203293-494d7ddbf7e0","photo-1481437156560-3205f6a55735","photo-1533900298318-6b8da08a523e","photo-1524758631624-e2822e304c36"].map((x)=>U(x)),
  see: ["photo-1552465011-b4e21bf6e79a","photo-1528181304800-259b08848526","photo-1563492065599-3520f775eeed","photo-1508009603885-50cf7c579365","photo-1519451241324-20b4ea2c4220","photo-1494949649109-ecfc3b8c35df","photo-1523906834658-6e24ef2386f9","photo-1502602898657-3e91760cbb34"].map((x)=>U(x)),
};
export const HERO_AMBIENT = [U("photo-1480796927426-f609979314bd",900), U("photo-1552465011-b4e21bf6e79a",900), U("photo-1519451241324-20b4ea2c4220",900)];
function hash(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
/** Deterministic per-venue placeholder photo. */
export function getVenueImage(category: Category, id: string): string { const a = LIB[category]; return a[hash(id) % a.length]; }
export function getHeroImage(hour: number): string { return HERO_AMBIENT[hour % HERO_AMBIENT.length]; }
