import GetYourGuideWidget from "./GetYourGuideWidget";
import { getWidgetProvider, gygLocationId } from "@/lib/experiences/widgets";

/**
 * "Things to do in [City]" — the primary, broad-coverage placement. Provider-
 * agnostic: it asks for the active widget provider and renders that provider's
 * CITY widget inside Routt's framing. Adding Klook/Viator later = another case
 * here; the destination page never changes.
 *
 * Commercial affiliate placement (covered by the footer disclosure) — kept
 * entirely separate from the /plan countdown's authoritative/visa handoffs.
 */
export default function Experiences({
  city,
  cityName,
}: {
  city: string;
  cityName: string;
}) {
  const provider = getWidgetProvider();
  const locationId = gygLocationId(city);
  if (provider === "getyourguide" && !locationId) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
      <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
        Things to do in {cityName}
      </h2>
      <p className="mt-2 font-body text-base text-ink/60">
        Bookable tours, tickets and activities — live prices and booking by our
        partner.
      </p>

      <div className="mt-8 rounded-[18px] border border-hairline bg-white p-2 shadow-soft sm:p-4">
        {provider === "getyourguide" && locationId ? (
          <GetYourGuideWidget type="city" locationId={locationId} />
        ) : null}
      </div>

      <p className="mt-5 font-body text-xs leading-relaxed text-ink/45">
        Experiences are provided by our booking partner — Routt may earn a
        commission, at no extra cost to you. Prices and availability are shown
        live by the provider and confirmed at checkout.
      </p>
    </section>
  );
}
