import Image from "next/image";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import DestinationCard from "@/components/DestinationCard";
import EmailCapture from "@/components/EmailCapture";
import Reveal from "@/components/Reveal";
import Icon, { type IconName } from "@/components/Icon";
import { getAllDestinations } from "@/lib/content";
import { getTheme } from "@/lib/theme";

const WHY: { title: string; body: string; icon: IconName }[] = [
  {
    title: "Honest, not sponsored-first",
    body: "We recommend what actually works — then tell you exactly where we earn a commission. The advice never bends to the payout.",
    icon: "shield",
  },
  {
    title: "Everything in one place",
    body: "Visa, money, connectivity, getting around — the handful of decisions that matter, sorted in one calm place instead of 40 browser tabs.",
    icon: "compass",
  },
  {
    title: "Built for Indian travellers",
    body: "Indian passports, Indian cards, and what your ₹ really gets you abroad. Specific and current — not a generic travel blog.",
    icon: "sparkle",
  },
];

const HOW: { step: string; title: string; body: string; icon: IconName }[] = [
  {
    step: "01",
    title: "Pick a destination",
    body: "Choose where you're headed right from the hero — hover to feel the place before you commit.",
    icon: "compass",
  },
  {
    step: "02",
    title: "Set your trip date",
    body: "Tell us when you fly and Routt builds a countdown anchored to your real dates.",
    icon: "route",
  },
  {
    step: "03",
    title: "Plan, sorted",
    body: "Tick off visa, eSIM, forex and more — each with the right official or trusted link.",
    icon: "star",
  },
];

export default function HomePage() {
  const destinations = getAllDestinations();
  const ctaTheme = getTheme("singapore");

  return (
    <>
      {/* ── Immersive hero ───────────────────────────────────── */}
      <HomeHero destinations={destinations} />

      {/* ── Destinations: the "tempt me" grid ────────────────── */}
      <section id="destinations" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
                Where to next?
              </h2>
              <p className="mt-3 font-body text-lg text-ink/60">
                Real places, real plans. Tap a destination and we&apos;ll get you
                sorted in one focused read.
              </p>
            </div>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((dest, i) => (
              <Reveal key={dest.slug} delay={(i % 3) * 80}>
                <DestinationCard dest={dest} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Routt ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
              Why travellers use Routt
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {WHY.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="h-full rounded-card border border-hairline bg-bg p-6 shadow-soft">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how" className="scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <Reveal>
            <h2 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
              How it works
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW.map((item, i) => (
              <Reveal key={item.step} delay={i * 80}>
                <div className="rounded-card p-2">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo-led CTA band ───────────────────────────────── */}
      <section className="px-6">
        <div className="relative mx-auto flex min-h-[20rem] max-w-6xl items-center overflow-hidden rounded-card">
          <Image
            src={ctaTheme.heroImage}
            alt={ctaTheme.mood}
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(8,18,30,0.78) 0%, rgba(8,18,30,0.5) 55%, rgba(8,18,30,0.2) 100%)",
            }}
          />
          <Reveal className="relative px-8 py-12 sm:px-12">
            <h2 className="max-w-xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Plan your trip, sorted.
            </h2>
            <p className="mt-3 max-w-md font-body text-lg text-white/85">
              One calm place that knows what to handle and when. Start your
              countdown in under a minute.
            </p>
            <Link
              href="/plan"
              className="mt-6 inline-flex min-h-[48px] items-center rounded-pill bg-coral px-7 font-body text-base font-semibold text-white shadow-soft transition-transform duration-200 hover:scale-[1.03]"
            >
              Plan my trip →
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Email capture ────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-16">
          <EmailCapture />
        </div>
      </section>
    </>
  );
}
