import type { Experience } from "@/lib/experiences/types";
import ExperienceCard from "./ExperienceCard";

/**
 * Horizontally scrollable row on mobile (snap), grid on desktop. Carries the
 * section heading + the affiliate/price disclosure.
 */
export default function ExperiencesRow({
  experiences,
  cityName,
  heading,
  subtitle,
}: {
  experiences: Experience[];
  cityName?: string;
  heading?: string;
  subtitle?: string;
}) {
  if (experiences.length === 0) return null;
  const title = heading ?? (cityName ? `Things to do in ${cityName}` : "Experiences");

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 font-body text-base text-ink/60">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {/* Mobile: horizontal snap scroll · Desktop: grid */}
      <div className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="w-[78%] shrink-0 snap-start sm:w-auto sm:shrink"
          >
            <ExperienceCard exp={exp} />
          </div>
        ))}
      </div>

      <p className="mt-5 font-body text-xs leading-relaxed text-ink/45">
        Bookable via our partners — Routt may earn a commission, at no extra cost
        to you. Prices are indicative &ldquo;from&rdquo; rates (marked *);
        confirm the live price and availability on the provider&apos;s page.
      </p>
    </section>
  );
}
