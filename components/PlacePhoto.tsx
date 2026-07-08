"use client";

import { useState } from "react";
import Image from "next/image";
import type { PlacePhoto as PlacePhotoType } from "@/lib/types";

/**
 * PlacePhoto — renders a place photo through next/image (cached + optimized),
 * falling back to a tasteful palette placeholder when there's no photo or the
 * load fails. Never a broken image, never generic stock. Photos SUPPORT the
 * verdict; sizing is decided by the parent (thumb on cards, hero on detail).
 */

/** Palette placeholder: elevate surface + a faint location mark. */
export function PhotoPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center bg-elevate ${className}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--faint)"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z" />
        <circle cx="12" cy="11" r="2.2" />
      </svg>
    </div>
  );
}

export interface PlacePhotoProps {
  photo?: PlacePhotoType;
  alt: string;
  sizes: string; // e.g. "72px" for thumbs, "(max-width: 440px) 100vw, 440px" for hero
  priority?: boolean;
  className?: string; // must size + position the container (relative is added)
}

export default function PlacePhoto({ photo, alt, sizes, priority, className = "" }: PlacePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!photo || failed) return <PhotoPlaceholder className={className} />;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={photo.url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
