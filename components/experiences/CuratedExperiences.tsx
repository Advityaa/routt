import GetYourGuideWidget from "./GetYourGuideWidget";
import { GYG_CURATED_TOUR_IDS, getWidgetProvider } from "@/lib/experiences/widgets";

/**
 * Homepage curated strip — a few hand-picked hero experiences via the ACTIVITY
 * widget. Commercial affiliate placement (footer disclosure applies).
 */
export default function CuratedExperiences() {
  const provider = getWidgetProvider();
  if (provider !== "getyourguide") return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Top experiences to book
      </h2>
      <p className="mt-2 font-body text-base text-ink/60">
        Handpicked tours and tickets across our destinations.
      </p>
      <div className="mt-8 rounded-[18px] border border-hairline bg-white p-2 shadow-soft sm:p-4">
        <GetYourGuideWidget type="activity" tourIds={GYG_CURATED_TOUR_IDS} />
      </div>
      <p className="mt-5 font-body text-xs leading-relaxed text-ink/45">
        Bookable via our partner — Routt may earn a commission, at no extra cost
        to you. Prices shown live by the provider.
      </p>
    </section>
  );
}
