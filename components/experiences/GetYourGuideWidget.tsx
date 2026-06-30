"use client";

import { useEffect, useRef, useState } from "react";
import {
  GYG_CURRENCY,
  GYG_LOCALE,
  GYG_PARTNER_ID,
  GYG_SCRIPT_SRC,
} from "@/lib/experiences/widgets";

/**
 * One reusable GetYourGuide widget for all three widget types (city / activity
 * / availability). GetYourGuide serves live data + handles booking; Routt earns
 * commission via the partner id. Booking happens on GYG, so prices are always
 * live (never our cached/stale values).
 *
 * Performance: the external script loads ONCE (module singleton) and only when
 * the widget scrolls near the viewport (IntersectionObserver) — it never blocks
 * initial load / mobile LCP. A skeleton reserves height so there's no layout
 * shift or blank gap while the widget hydrates.
 */

type WidgetType = "city" | "activity" | "availability";

// Singleton: inject the GYG partner script a single time across all widgets.
let gygScriptPromise: Promise<void> | null = null;
function loadGygScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (gygScriptPromise) return gygScriptPromise;
  gygScriptPromise = new Promise<void>((resolve) => {
    if (document.querySelector(`script[src="${GYG_SCRIPT_SRC}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = GYG_SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-gyg-partner-id", GYG_PARTNER_ID);
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
  return gygScriptPromise;
}

const MIN_HEIGHT: Record<WidgetType, number> = {
  city: 600,
  activity: 520,
  availability: 560,
};

export default function GetYourGuideWidget({
  type,
  locationId,
  tourId,
  tourIds,
  variant = "vertical",
}: {
  type: WidgetType;
  locationId?: string;
  tourId?: string;
  tourIds?: string;
  variant?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  // Defer until near the viewport, then load the script once.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "250px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (visible) loadGygScript();
  }, [visible]);

  // Hide the skeleton once GYG renders its iframe (no premature blank gap).
  useEffect(() => {
    if (!visible) return;
    const el = ref.current;
    if (!el) return;
    if (el.querySelector("iframe")) {
      setReady(true);
      return;
    }
    const mo = new MutationObserver(() => {
      if (el.querySelector("iframe")) {
        setReady(true);
        mo.disconnect();
      }
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [visible]);

  // Build the data-attributes GYG's embed script reads.
  const attrs: Record<string, string> = {
    "data-gyg-widget": type,
    "data-gyg-partner-id": GYG_PARTNER_ID,
    "data-gyg-locale-code": GYG_LOCALE,
  };
  if (type === "city" && locationId) {
    attrs["data-gyg-href"] = "https://widget.getyourguide.com/default/city.frame";
    attrs["data-gyg-location-id"] = locationId;
  } else if (type === "activity" && tourIds) {
    attrs["data-gyg-href"] = "https://widget.getyourguide.com/default/activities.frame";
    attrs["data-gyg-tour-ids"] = tourIds;
    attrs["data-gyg-currency"] = GYG_CURRENCY;
  } else if (type === "availability" && tourId) {
    attrs["data-gyg-href"] = "https://widget.getyourguide.com/default/availability.frame";
    attrs["data-gyg-tour-id"] = tourId;
    attrs["data-gyg-currency"] = GYG_CURRENCY;
    attrs["data-gyg-variant"] = variant;
  }

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{ minHeight: ready ? undefined : MIN_HEIGHT[type] }}
    >
      {visible ? (
        <div {...attrs}>
          <span className="sr-only">
            Powered by{" "}
            <a target="_blank" rel="sponsored noopener noreferrer" href="https://www.getyourguide.com/">
              GetYourGuide
            </a>
          </span>
        </div>
      ) : null}

      {!ready ? <WidgetSkeleton /> : null}
    </div>
  );
}

function WidgetSkeleton() {
  return (
    <div className="absolute inset-0 grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-hairline bg-white">
          <div className="aspect-[4/3] w-full animate-pulse bg-fill" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-4/5 animate-pulse rounded bg-fill" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-fill" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-fill" />
          </div>
        </div>
      ))}
    </div>
  );
}
