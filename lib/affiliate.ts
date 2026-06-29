import { track } from "@vercel/analytics";

/**
 * The four Phase 1 affiliate categories. Nothing else ships yet.
 */
export type AffiliateCategory = "esim" | "forex" | "insurance" | "activities";

export interface AffiliatePartner {
  /** Stable id used in tracking + as the map key. */
  id: string;
  category: AffiliateCategory;
  /** Brand shown on the button. */
  name: string;
  /** Short value line under the button label. */
  blurb: string;
  /**
   * Destination URL. Real affiliate/deep links get pasted here later — the
   * id stays stable so historical click data keeps lining up.
   */
  url: string;
}

/**
 * Central map of every affiliate link in the product. Playbooks reference
 * partners by id (via <AffiliateButton partner="airalo" />) so links live in
 * exactly one place and are trivial to swap for real tracking URLs.
 */
export const PARTNERS = {
  airalo: {
    id: "airalo",
    category: "esim",
    name: "Airalo",
    blurb: "Cheapest regional eSIM, install before you fly",
    url: "https://www.airalo.com/",
  },
  holafly: {
    id: "holafly",
    category: "esim",
    name: "Holafly",
    blurb: "Unlimited-data eSIM if you tether a lot",
    url: "https://www.holafly.com/",
  },
  niyo: {
    id: "niyo",
    category: "forex",
    name: "Niyo Global",
    blurb: "Zero-markup forex card on the Visa rate",
    url: "https://www.goniyo.com/",
  },
  scapia: {
    id: "scapia",
    category: "forex",
    name: "Scapia",
    blurb: "No-markup spends + travel rewards",
    url: "https://www.scapia.cards/",
  },
  amazeinsurance: {
    id: "amazeinsurance",
    category: "insurance",
    name: "ACKO Travel",
    blurb: "Per-trip cover, buy in minutes",
    url: "https://www.acko.com/travel-insurance/",
  },
  getyourguide: {
    id: "getyourguide",
    category: "activities",
    name: "GetYourGuide",
    blurb: "Skip-the-line tickets & day tours",
    url: "https://www.getyourguide.com/",
  },
  klook: {
    id: "klook",
    category: "activities",
    name: "Klook",
    blurb: "Best Asia activity & transfer prices",
    url: "https://www.klook.com/",
  },
} satisfies Record<string, AffiliatePartner>;

export type PartnerId = keyof typeof PARTNERS;

export function getPartner(id: PartnerId): AffiliatePartner {
  return PARTNERS[id];
}

/**
 * Fire the outbound-click event. This is THE metric that matters in Phase 1:
 * of the people who view a playbook, what % click an affiliate link.
 *
 * Called by AffiliateButton just before navigation. Kept here (not in the
 * component) so every tracked surface reports an identical event shape.
 */
export function trackAffiliateClick(params: {
  partner: AffiliatePartner;
  /** Slug of the playbook the click came from, e.g. "dubai". */
  destination: string;
}): void {
  track("affiliate_click", {
    partner: params.partner.id,
    category: params.partner.category,
    destination: params.destination,
  });
}
