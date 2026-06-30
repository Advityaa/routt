import { EXPERIENCES_MODE } from "@/lib/experiences/config";
import { getExperiences } from "@/lib/experiences";
import ExperiencesRow from "./ExperiencesRow";
import ExperienceWidget from "./ExperienceWidget";

/**
 * "Things to do in [City]". Switches between API mode (our normalized cards)
 * and WIDGET mode (provider embed) behind the EXPERIENCES_MODE flag. Server
 * component — provider keys never reach the client.
 */
export default async function Experiences({
  city,
  cityName,
}: {
  city: string;
  cityName: string;
}) {
  if (EXPERIENCES_MODE === "widget") {
    return (
      <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Things to do in {cityName}
        </h2>
        <div className="mt-8">
          <ExperienceWidget title={`Things to do in ${cityName}`} />
        </div>
        <p className="mt-5 font-body text-xs leading-relaxed text-ink/45">
          Bookable via our partners — Routt may earn a commission, at no extra
          cost to you. Live prices and availability are shown by the provider.
        </p>
      </section>
    );
  }

  const experiences = await getExperiences(city);
  return (
    <ExperiencesRow
      experiences={experiences}
      cityName={cityName}
      subtitle="Bookable tours, tickets and activities — book on our partner, sorted in minutes."
    />
  );
}
