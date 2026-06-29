import type { PartnerId } from "./affiliate";

/**
 * The structured task data behind the countdown. This is the product's moat:
 * finite, reviewable, per-destination task lists — NOT prose, and never a
 * volatile assertion. Risky items (visa/entry) store RANGES and hand off to
 * the authoritative source; they must be re-verified by a human on a cadence.
 *
 * Data status is per-destination: a destination with `lastReviewed` set has
 * been human-verified; tasks without it (or flagged `placeholder`) are stubs.
 */

export type TaskCategory =
  | "visa"
  | "passport"
  | "insurance"
  | "money"
  | "connectivity"
  | "apps"
  | "arrival";

/** Where a task hands the user off. Visa/entry is ALWAYS authoritative. */
export type HandoffType = "authoritative" | "commercial" | "info";

export interface TaskHandoff {
  type: HandoffType;
  /** Optional — pure informational tasks may carry no button. */
  label?: string;
  /** Used for authoritative + info handoffs. */
  url?: string;
  /** Used for commercial handoffs — resolves against lib/affiliate.ts. */
  partnerId?: PartnerId;
}

/**
 * Honest expectation ranges for time-sensitive/cost items (esp. visa). Always
 * ranges, never a single asserted figure — sources disagree and rules change.
 */
export interface FactRanges {
  standardProcessing?: string;
  expressProcessing?: string;
  feeRangeINR?: string;
  applyAheadRecommendation?: string;
}

export interface TripTask {
  id: string;
  category: TaskCategory;
  title: string;
  /** Plain, honest explanation. May be multi-sentence for risky items. */
  why: string;
  /**
   * Start-by lead time in days before departure. The engine compares this to
   * (tripDate − today) to compute urgency — it never asserts a volatile fact.
   */
  leadTimeDays: number;
  /**
   * How many days before the start-by point we begin nudging ("coming up").
   * Optional — the engine applies a sensible default when omitted.
   */
  nudgeWindowDays?: number;
  /**
   * Rough processing time (days) used only to compute the honest
   * "you have X days, this takes ~Y" line. Never a yes/no.
   */
  processingDays?: number;
  /** Shown to the user as "what to expect" — ranges, not quotes. */
  factsRange?: FactRanges;
  /**
   * Internal sequencing/urgency guidance for the builder + future engine work.
   * NOT shown to the user.
   */
  urgencyRule?: string;
  handoff: TaskHandoff;
  /** Citation / review note for the data pass. */
  source: string;
  /** TRUE until a human has verified this task's data. */
  placeholder: boolean;
}

export interface ReferenceTable {
  label: string;
  rows: { label: string; value: string }[];
  note?: string;
}

export interface TripDestination {
  slug: string;
  title: string;
  country: string;
  flag: string;
  fromPassport?: string;
  /** e.g. "2026-06" — presence means human-verified. */
  lastReviewed?: string;
  /** Internal note on data confidence + re-verify cadence. Not user-facing. */
  reviewNote?: string;
  /** Optional destination-specific heads-up shown atop the countdown. */
  note?: string;
  tasks: TripTask[];
  /** Optional expectation-setting reference (e.g. typical cab fares). */
  reference?: ReferenceTable;
}

const PLACEHOLDER = "PLACEHOLDER — pending human verification";

/* ── Shared task factories (placeholder destinations only) ─────────────── */

function passportTask(): TripTask {
  return {
    id: "passport",
    category: "passport",
    title: "Check your passport validity",
    why: "Most countries require at least 6 months validity beyond your travel dates.",
    leadTimeDays: 60,
    nudgeWindowDays: 45,
    handoff: {
      type: "info",
      label: "How to renew (Passport Seva)",
      url: "https://www.passportindia.gov.in/",
    },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

function insuranceTask(): TripTask {
  return {
    id: "insurance",
    category: "insurance",
    title: "Buy travel insurance",
    why: "Covers medical emergencies and trip disruptions — cheap for a short trip.",
    leadTimeDays: 7,
    nudgeWindowDays: 14,
    handoff: { type: "commercial", label: "Compare cover", partnerId: "amazeinsurance" },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

function forexTask(): TripTask {
  return {
    id: "forex",
    category: "money",
    title: "Sort a zero-markup forex card",
    why: "Avoids the 3%+ markup and fees a regular Indian card charges abroad.",
    leadTimeDays: 14,
    nudgeWindowDays: 10,
    handoff: { type: "commercial", label: "Get a forex card", partnerId: "niyo" },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

function esimTask(): TripTask {
  return {
    id: "esim",
    category: "connectivity",
    title: "Install a travel eSIM",
    why: "Land connected without the airport SIM queue or roaming bills.",
    leadTimeDays: 3,
    nudgeWindowDays: 5,
    handoff: { type: "commercial", label: "Get an eSIM", partnerId: "airalo" },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

function arrivalTask(): TripTask {
  return {
    id: "arrival",
    category: "arrival",
    title: "Pack arrival essentials",
    why: "A little local cash, printed hotel address + return ticket, and offline maps.",
    leadTimeDays: 1,
    nudgeWindowDays: 3,
    handoff: { type: "info", label: "What to carry" },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

function appsTask(why: string): TripTask {
  return {
    id: "apps",
    category: "apps",
    title: "Install the apps you'll need",
    why,
    leadTimeDays: 3,
    nudgeWindowDays: 5,
    handoff: { type: "info" },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

/* ── Dubai: HUMAN-VERIFIED (2026-06) ───────────────────────────────────── */

const dubai: TripDestination = {
  slug: "dubai",
  title: "Dubai",
  country: "United Arab Emirates",
  flag: "🇦🇪",
  fromPassport: "India",
  lastReviewed: "2026-06",
  reviewNote:
    "Sources disagree on exact visa fees and processing times. We store RANGES and always hand off to authoritative sources. A human must re-verify visa data every ~60 days as UAE rules change frequently.",
  note: "Heads-up: the UAE blocks WhatsApp/FaceTime voice & video calls on local SIMs — a travel eSIM usually keeps WhatsApp video to home working. More in the connectivity task below.",
  tasks: [
    {
      id: "passport-validity",
      category: "passport",
      title: "Check your passport is valid for 6+ months",
      why: "Dubai requires your passport to be valid at least 6 months from your travel date, with 2 blank pages. If it's close to expiring, renew BEFORE applying for the visa.",
      leadTimeDays: 45,
      nudgeWindowDays: 30,
      urgencyRule:
        "If passport expires within ~8 months of trip, treat as DO NOW (renewal takes weeks).",
      handoff: {
        type: "authoritative",
        label: "Check passport renewal (Passport Seva)",
        url: "https://www.passportindia.gov.in",
      },
      source: "Human-reviewed 2026-06. Reminder only — Routt does not know your passport expiry.",
      placeholder: false,
    },
    {
      id: "visa",
      category: "visa",
      title: "Sort your Dubai visa — this is task #1",
      why: "Indian passport holders are NOT visa-free for Dubai. Most Indians must apply for a UAE tourist visa online BEFORE flying. EXCEPTION: if you hold a valid visa or residence permit (6+ months) from the USA, UK, EU/Schengen, Australia, Canada, Japan, New Zealand, South Korea, or Singapore, you may be eligible for a visa on arrival (~14 days) — but rules around this change, so confirm on the official portal.",
      leadTimeDays: 21,
      nudgeWindowDays: 21,
      processingDays: 5,
      factsRange: {
        standardProcessing: "roughly 3 to 5 working days (longer in peak season Oct–Mar)",
        expressProcessing: "roughly 24 to 48 hours for an extra fee",
        feeRangeINR:
          "approximately ₹6,700 to ₹9,500 for a 30-day tourist visa (varies by provider/type)",
        applyAheadRecommendation:
          "apply at least 2–3 weeks before travel; UAE immigration is closed Sat/Sun and half-day Fri",
      },
      urgencyRule:
        "If trip is <7 working days away, flag RED (only express may work). If >21 days, GREEN but say 'start now so you're not rushed.'",
      handoff: {
        type: "authoritative",
        label: "Apply on official UAE ICP portal (or via your airline)",
        url: "https://icp.gov.ae",
      },
      source:
        "Human-reviewed 2026-06. CRITICAL: never assert a yes/no on eligibility or a single fee — ranges + official handoff only. Re-verify every ~60 days.",
      placeholder: false,
    },
    {
      id: "documents-for-visa",
      category: "visa",
      title: "Prepare your visa documents",
      why: "Dubai visa applications require: passport scan (first/last page), white-background photo (35x45mm), confirmed return flight booking, and a confirmed hotel booking — even if staying with family. Mismatched or unclear documents are the #1 cause of rejection.",
      leadTimeDays: 22,
      nudgeWindowDays: 14,
      urgencyRule: "Tie to visa task; must be ready before applying.",
      handoff: { type: "info" },
      source: "Human-reviewed 2026-06.",
      placeholder: false,
    },
    {
      id: "travel-insurance",
      category: "insurance",
      title: "Get travel insurance",
      why: "Travel insurance is often required or strongly recommended for UAE entry and is genuinely worth it for medical cover abroad. Some visa packages bundle it.",
      leadTimeDays: 14,
      nudgeWindowDays: 14,
      urgencyRule: "Should be done before visa submission if your visa type requires it.",
      handoff: { type: "commercial", label: "Compare travel insurance", partnerId: "amazeinsurance" },
      source: "Human-reviewed 2026-06. Commercial handoff — affiliate OK, disclosed.",
      placeholder: false,
    },
    {
      id: "forex-card",
      category: "money",
      title: "Order a zero-markup forex card",
      why: "A normal Indian card charges ~3.5% forex markup on every swipe abroad. A zero-markup travel/forex card loaded with AED avoids most of that. Order early so the physical card arrives before you fly.",
      leadTimeDays: 12,
      nudgeWindowDays: 10,
      urgencyRule:
        "If trip <7 days away, suggest an instant/virtual card option since physical delivery may not arrive.",
      handoff: { type: "commercial", label: "Compare zero-markup forex cards", partnerId: "niyo" },
      source: "Human-reviewed 2026-06. Commercial handoff — affiliate OK, disclosed. Never claim a specific exchange rate.",
      placeholder: false,
    },
    {
      id: "esim",
      category: "connectivity",
      title: "Buy a UAE eSIM (don't use your carrier's roaming pack)",
      why: "Your Indian carrier's roaming pack is the expensive default. A travel eSIM is far cheaper for data. Dubai-specific tip: the UAE blocks WhatsApp/FaceTime VOICE & VIDEO on local SIMs — but on an international travel eSIM, WhatsApp video calls home usually still work. Install before you board; activate after you land. Keep your Indian SIM for bank OTPs.",
      leadTimeDays: 5,
      nudgeWindowDays: 7,
      urgencyRule: "Can be done last-minute (instant delivery), but remind in the final week.",
      handoff: { type: "commercial", label: "Get a Dubai eSIM", partnerId: "airalo" },
      source: "Human-reviewed 2026-06. Commercial handoff — affiliate OK, disclosed. The VOIP fact is verified.",
      placeholder: false,
    },
    {
      id: "apps-to-install",
      category: "apps",
      title: "Install the apps you'll need on arrival",
      why: "Install before you fly so you're not fumbling at the airport: Careem + Uber (both accept Indian cards), Google Maps (download Dubai offline map), RTA Dubai (metro/Nol), Talabat (food delivery), Zomato Dubai.",
      leadTimeDays: 3,
      nudgeWindowDays: 5,
      urgencyRule: "Final-week reminder.",
      handoff: { type: "info" },
      source: "Human-reviewed 2026-06.",
      placeholder: false,
    },
    {
      id: "arrival-essentials",
      category: "arrival",
      title: "Pack your arrival essentials",
      why: "In your HAND luggage (not checked): passport (6+ months valid), printed return ticket, printed hotel booking, printed/saved e-visa. Carry some AED cash for the abra (~AED 1), souks, and tips. Screenshot your hotel address in Arabic + English.",
      leadTimeDays: 2,
      nudgeWindowDays: 4,
      urgencyRule: "Final 48h reminder.",
      handoff: { type: "info" },
      source: "Human-reviewed 2026-06.",
      placeholder: false,
    },
  ],
  reference: {
    label: "Typical cab fares (AED)",
    rows: [
      { label: "Airport → Downtown", value: "50–80" },
      { label: "Downtown → Marina", value: "35–55" },
      { label: "Airport taxi start", value: "~25 (incl. surcharge)" },
    ],
    note: "Reference ranges only, for setting expectations — not live prices. Re-verify periodically.",
  },
};

/* ── Other destinations: PLACEHOLDER (engine/UI only) ──────────────────── */

const bangkok: TripDestination = {
  slug: "bangkok",
  title: "Bangkok",
  country: "Thailand",
  flag: "🇹🇭",
  tasks: [
    {
      id: "visa",
      category: "visa",
      title: "Check Thailand entry requirements",
      why: "Indian passport holders may enter visa-free for short stays — confirm the current rule and carry proof of onward travel.",
      leadTimeDays: 14,
      nudgeWindowDays: 14,
      processingDays: 3,
      handoff: {
        type: "authoritative",
        label: "Official Thai immigration / e-Visa",
        url: "https://www.thaievisa.go.th/",
      },
      source: PLACEHOLDER,
      placeholder: true,
    },
    passportTask(),
    esimTask(),
    forexTask(),
    insuranceTask(),
    appsTask("Grab gives upfront fares so you skip tuk-tuk and taxi overcharging — install it before you land."),
    arrivalTask(),
  ],
};

const singapore: TripDestination = {
  slug: "singapore",
  title: "Singapore",
  country: "Singapore",
  flag: "🇸🇬",
  tasks: [
    {
      id: "visa",
      category: "visa",
      title: "Apply for your Singapore visa",
      why: "Indian passport holders need a visa, usually via an authorised agent. Also file the free SG Arrival Card near departure.",
      leadTimeDays: 21,
      nudgeWindowDays: 21,
      processingDays: 5,
      handoff: {
        type: "authoritative",
        label: "Official ICA visa requirements",
        url: "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements",
      },
      source: PLACEHOLDER,
      placeholder: true,
    },
    passportTask(),
    esimTask(),
    forexTask(),
    insuranceTask(),
    appsTask("You can tap a contactless card straight onto MRT gates — no transit card needed. Grab covers the rest."),
    arrivalTask(),
  ],
};

const bali: TripDestination = {
  slug: "bali",
  title: "Bali",
  country: "Indonesia",
  flag: "🇮🇩",
  note: "Most travel mishaps in Bali are scooter accidents — make sure your insurance covers two-wheelers.",
  tasks: [
    {
      id: "visa",
      category: "visa",
      title: "Arrange your Indonesia visa-on-arrival",
      why: "Indian passport holders get visa-on-arrival; the e-VoA can be paid online before you fly to skip the airport queue.",
      leadTimeDays: 7,
      nudgeWindowDays: 14,
      processingDays: 2,
      handoff: {
        type: "authoritative",
        label: "Official Indonesia e-VoA portal",
        url: "https://evisa.imigrasi.go.id/",
      },
      source: PLACEHOLDER,
      placeholder: true,
    },
    passportTask(),
    esimTask(),
    forexTask(),
    {
      ...insuranceTask(),
      why: "Essential in Bali — confirm it covers scooter/two-wheeler accidents.",
    },
    appsTask("Gojek and Grab beat the inflated street quotes for rides, scooter-taxis, and food delivery."),
    arrivalTask(),
  ],
};

export const TRIP_DESTINATIONS: TripDestination[] = [dubai, bangkok, singapore, bali];

export function getTripDestination(slug: string): TripDestination | undefined {
  return TRIP_DESTINATIONS.find((d) => d.slug === slug);
}

/** Lightweight options for the setup dropdown. */
export const TRIP_DESTINATION_OPTIONS = TRIP_DESTINATIONS.map((d) => ({
  slug: d.slug,
  title: d.title,
  flag: d.flag,
  country: d.country,
}));
