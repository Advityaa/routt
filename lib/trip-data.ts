import type { PartnerId } from "./affiliate";

/**
 * The structured task data behind the countdown. This is the product's moat:
 * finite, reviewable, per-destination task lists — NOT prose.
 *
 * ⚠️ v1 STATUS: PLACEHOLDER. Lead times, processing estimates, and official
 * URLs below are reasonable stubs to build the engine + UI against. Every task
 * is flagged `placeholder: true` and must pass a human-verified data pass
 * (DoD #5) before launch. Visa/entry handoffs especially must be confirmed
 * against the live official government portal.
 */

export type TaskCategory =
  | "visa"
  | "passport"
  | "insurance"
  | "forex"
  | "connectivity"
  | "apps"
  | "arrival";

/** Where a task hands the user off. Visa/entry is ALWAYS authoritative. */
export type HandoffType = "authoritative" | "commercial" | "info";

export interface TaskHandoff {
  type: HandoffType;
  label: string;
  /** Used for authoritative + info handoffs. */
  url?: string;
  /** Used for commercial handoffs — resolves against lib/affiliate.ts. */
  partnerId?: PartnerId;
}

export interface TripTask {
  id: string;
  category: TaskCategory;
  title: string;
  /** One plain line: why this matters. */
  why: string;
  /**
   * Start-by lead time in days before departure. The engine compares this to
   * (tripDate − today) to compute urgency — it never asserts a volatile fact.
   */
  leadTimeDays: number;
  /** How many days before the start-by point we begin nudging ("coming up"). */
  nudgeWindowDays: number;
  /**
   * For time-sensitive tasks (esp. visa): rough processing time, used only to
   * compute the honest "you have X days, this takes ~Y" line. Never a yes/no.
   */
  processingDays?: number;
  handoff: TaskHandoff;
  /** Citation for the human-review pass. */
  source: string;
  /** TRUE until a human has verified this task's data. */
  placeholder: boolean;
}

export interface TripDestination {
  slug: string;
  title: string;
  country: string;
  flag: string;
  /** Optional destination-specific heads-up shown at the top of the countdown. */
  note?: string;
  tasks: TripTask[];
}

const PLACEHOLDER = "PLACEHOLDER — pending human verification";

/* ── Shared task factories ──────────────────────────────────────────────
 * The commercial + rule-based tasks are near-identical across destinations,
 * so we build them from factories. Destination-specific items (visa, the
 * connectivity note, the local apps) are written inline below.
 */

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
    category: "forex",
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

function appsTask(id: string, why: string): TripTask {
  return {
    id: "apps",
    category: "apps",
    title: "Install the apps you'll need",
    why,
    leadTimeDays: 3,
    nudgeWindowDays: 5,
    handoff: { type: "info", label: id },
    source: PLACEHOLDER,
    placeholder: true,
  };
}

/* ── Destinations ──────────────────────────────────────────────────────── */

export const TRIP_DESTINATIONS: TripDestination[] = [
  {
    slug: "dubai",
    title: "Dubai",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    note: "Heads-up: WhatsApp/FaceTime voice & video calls are restricted on local networks — a travel eSIM or a VoIP workaround keeps them working.",
    tasks: [
      {
        id: "visa",
        category: "visa",
        title: "Apply for your UAE tourist visa",
        why: "Indian passport holders need a visa arranged before flying.",
        leadTimeDays: 21,
        nudgeWindowDays: 21,
        processingDays: 5,
        handoff: {
          type: "authoritative",
          label: "Official UAE visa portal (ICP)",
          url: "https://icp.gov.ae/en/",
        },
        source: PLACEHOLDER,
        placeholder: true,
      },
      passportTask(),
      esimTask(),
      forexTask(),
      insuranceTask(),
      appsTask("Careem (local Uber), plus Google Maps offline", "Careem is the cab app locals use; download it before you land."),
      arrivalTask(),
    ],
  },
  {
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
      appsTask("Grab (rides + food) — your anti-scam ride app", "Grab gives upfront fares so you skip tuk-tuk and taxi overcharging."),
      arrivalTask(),
    ],
  },
  {
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
      appsTask("Grab; or just tap your forex card on the MRT", "You can tap a contactless card straight onto MRT gates — no transit card needed."),
      arrivalTask(),
    ],
  },
  {
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
      appsTask("Gojek + Grab (rides, scooter-taxis, food)", "Gojek and Grab beat the inflated street quotes for rides and delivery."),
      arrivalTask(),
    ],
  },
];

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
