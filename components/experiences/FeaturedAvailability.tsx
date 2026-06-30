import GetYourGuideWidget from "./GetYourGuideWidget";
import { getWidgetProvider, gygFeaturedTour } from "@/lib/experiences/widgets";

/**
 * High-intent AVAILABILITY widget — used sparingly, near the bottom of a
 * destination page, only where we have a verified hero tour. Shows real-time
 * slots to drive bookings. Renders nothing if no featured tour is configured.
 */
export default function FeaturedAvailability({
  city,
  cityName,
}: {
  city: string;
  cityName: string;
}) {
  const provider = getWidgetProvider();
  const tourId = gygFeaturedTour(city);
  if (provider !== "getyourguide" || !tourId) return null;

  return (
    <section className="mx-auto max-w-3xl px-6 pb-16">
      <h2 className="font-display text-2xl font-semibold text-ink">
        Check live availability in {cityName}
      </h2>
      <p className="mt-2 font-body text-sm text-ink/60">
        A traveller-favourite experience — see real-time slots and book in
        minutes.
      </p>
      <div className="mt-6 rounded-[18px] border border-hairline bg-white p-2 shadow-soft sm:p-4">
        <GetYourGuideWidget type="availability" tourId={tourId} variant="vertical" />
      </div>
    </section>
  );
}
