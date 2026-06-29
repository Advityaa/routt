import HeroChecklist from "@/components/HeroChecklist";
import DestinationCard from "@/components/DestinationCard";
import EmailCapture from "@/components/EmailCapture";
import { getAllDestinations } from "@/lib/content";

const WHY = [
  {
    title: "Honest, not sponsored-first",
    body: "We recommend what actually works for a first trip — then tell you exactly where we earn a commission. The advice never bends to the payout.",
  },
  {
    title: "Made for first-timers",
    body: "No jargon, no 40-tab research spiral. Just the few decisions that matter — connectivity, money, getting around — settled before you fly.",
  },
  {
    title: "India-specific",
    body: "Built around Indian carriers, forex cards, and what your ₹ actually gets you on the ground. Not a generic Western travel blog.",
  },
];

const HOW = [
  {
    step: "01",
    title: "Pick your destination",
    body: "Choose where you're headed. Each playbook is one focused read, not a maze of links.",
  },
  {
    step: "02",
    title: "Run the checklist",
    body: "Connectivity, money, cabs, food, arrival. Settle each one with a clear pick and why.",
  },
  {
    step: "03",
    title: "Act with confidence",
    body: "Set up your eSIM and forex card before you go, and land knowing exactly what to do.",
  },
];

export default function HomePage() {
  const destinations = getAllDestinations();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Faint ambient glow — the only glow in the whole product. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[36rem] w-[36rem] -translate-x-1/2 animate-ambient rounded-full bg-fill blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-pill border border-hairline bg-white px-3.5 py-1.5 font-body text-xs font-medium uppercase tracking-wider text-primary shadow-soft">
              First-trip playbooks
            </span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl">
              Do your first trip abroad{" "}
              <span className="text-primary">right.</span>
            </h1>
            <p className="mt-6 max-w-xl font-body text-lg leading-relaxed text-ink/65">
              Which eSIM beats your carrier pack. How to carry zero-markup forex.
              The cab app locals actually use. Honest, India-specific advice for
              first-time international travellers — so you don&apos;t overpay or
              get caught out.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#destinations"
                className="rounded-pill bg-coral px-7 py-3.5 font-body text-base font-semibold text-white shadow-soft transition-transform duration-200 hover:scale-[1.03]"
              >
                Browse destinations
              </a>
              <a
                href="#how"
                className="rounded-pill border border-hairline bg-white px-7 py-3.5 font-body text-base font-semibold text-navy shadow-soft transition-transform duration-200 hover:scale-[1.03]"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Signature interactive element */}
          <HeroChecklist destinations={destinations} />
        </div>
      </section>

      {/* ── Destination grid ─────────────────────────────────── */}
      <section id="destinations" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold text-ink">
              Where are you headed?
            </h2>
            <p className="mt-3 font-body text-lg text-ink/60">
              One focused playbook per destination. Pick yours and get sorted in
              a single read.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest) => (
              <DestinationCard key={dest.slug} dest={dest} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Routt ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl font-semibold text-ink">
            Why trust Routt
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {WHY.map((item) => (
              <div
                key={item.title}
                className="rounded-card border border-hairline bg-bg p-6 shadow-soft"
              >
                <h3 className="font-display text-xl font-semibold text-navy">
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
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-4xl font-semibold text-ink">
            How it works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {HOW.map((item) => (
              <div key={item.step} className="rounded-card p-2">
                <span className="font-display text-3xl font-semibold text-primary/40">
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
