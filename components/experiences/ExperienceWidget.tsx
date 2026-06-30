"use client";

import { useEffect, useRef } from "react";

/**
 * Widget-mode wrapper. Drops a provider's official embed (script or iframe)
 * into our design shell — the provider serves live data + handles booking.
 *
 * `embedSrc` (iframe) or `scriptSrc` come from config/env when a provider's
 * widget is approved. Until then it renders a labelled placeholder so the
 * surface is visible without faking provider data.
 */
export default function ExperienceWidget({
  embedSrc,
  scriptSrc,
  title = "Live experiences",
}: {
  embedSrc?: string;
  scriptSrc?: string;
  title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptSrc || !ref.current) return;
    const s = document.createElement("script");
    s.src = scriptSrc;
    s.async = true;
    ref.current.appendChild(s);
    return () => {
      s.remove();
    };
  }, [scriptSrc]);

  if (embedSrc) {
    return (
      <iframe
        src={embedSrc}
        title={title}
        loading="lazy"
        className="h-[28rem] w-full rounded-[18px] border border-hairline"
      />
    );
  }

  if (scriptSrc) {
    return <div ref={ref} className="min-h-[20rem] w-full" data-experiences-widget />;
  }

  return (
    <div className="rounded-[18px] border border-dashed border-hairline bg-fill/30 px-6 py-10 text-center">
      <p className="font-body text-sm font-medium text-ink/60">
        Live provider widget loads here in widget mode.
      </p>
      <p className="mt-1 font-body text-xs text-ink/40">
        Set the provider embed in config once credentials are approved.
      </p>
    </div>
  );
}
