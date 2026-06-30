import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import DestinationCard from "@/components/DestinationCard";
import EmailCapture from "@/components/EmailCapture";
import Icon, { type IconName } from "@/components/Icon";
import { getAllDestinations } from "@/lib/content";

const WHY: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Honest, not sponsored-first",
    body: "We recommend what actually works for a first trip — then tell you exactly where we earn a commission. The advice never bends to the payout.",
    icon: "shield",
  },
  {
    title: "Made for first-timers",
    body: "No jargon, no 40-tab research spiral. Just the few decisions that matter — connectivity, money, getting around — settled before you fly.",
    icon: "compass",
  },
  {
    title: "India-specific",
    body: "Built around Indian carriers, forex cards, and what your ₹ actually gets you on the ground. Not a generic Western travel blog.",
    icon: "sparkle",
  },
];

const HOW: { step: string; title: string; body: string; icon: IconName }[] = [
  {
    step: "01",
    title: "Pick your destination",
    body: "Choose where you're headed. Each playbook is one focused read, not a maze of links.",
    icon: "compass",
  },
  {
    step: "02",
    title: "Run the checklist",
    body: "Connectivity, money, cabs, food, arrival. Settle each one with a clear pick and why.",
    icon: "route",
  },
  {
    step: "03",
    title: "Act with confidence",
    body: "Set up your eSIM and forex card before you go, and land knowing exactly what to do.",
    icon: "sparkle",
  },
];

export default function HomePage() {
  const destinations = getAllDestinations();

  return (
    <>
      {/* ── Hero (themed, interactive) ───────────────────────── */}
      <HomeHero destinations={destinations} />

      {/* ── Destination grid ─────────────────────────────────── */}
      <section id="destinations" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Where are you headed?
            </h2>
            <p className="mt-3 font-body text-base text-ink/60 sm:text-lg">
              One focused playbook per destination. Pick yours and get sorted in
              a single read.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {destinations.map((dest) => (
              <DestinationCard key={dest.slug} dest={dest} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Routt ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Why trust Routt
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {WHY.map((item) => (
              <div
                key={item.title}
                className="rounded-card border border-hairline bg-bg p-6 shadow-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fill text-primary">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-navy">
                  {item.title}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-ink/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            How it works
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW.map((item) => (
              <div key={item.step} className="rounded-card p-2">
                <span className="flex items-center gap-2 font-display text-3xl font-semibold text-primary/40">
                  <Icon name={item.icon} className="h-5 w-5 text-primary" />
                  {item.step}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 font-body text-sm leading-relaxed text-ink/65">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Email capture ────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 pb-8">
          <EmailCapture />
        </div>
      </section>
    </>
  );
}
