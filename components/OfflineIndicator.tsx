"use client";

import { useEffect, useState } from "react";

/**
 * A small global pill shown only when the device is offline — reassures the
 * traveler that what they're seeing is the cached/saved copy, on purpose.
 */
export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-3 z-50 flex justify-center px-5">
      <div className="flex items-center gap-2 rounded-pill border border-line bg-elevate px-3.5 py-1.5 font-mono text-[11.5px] text-muted shadow-card">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--verdict-fading)" }}
        />
        Offline · showing saved
      </div>
    </div>
  );
}
