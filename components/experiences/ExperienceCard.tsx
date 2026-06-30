"use client";

import Image from "next/image";
import { Star, Clock } from "lucide-react";
import { trackExperienceClick } from "@/lib/affiliate";
import type { Experience } from "@/lib/experiences/types";

const fmtPrice = (n: number, currency: string) => {
  const sym = currency === "INR" ? "₹" : `${currency} `;
  return `${sym}${n.toLocaleString("en-IN")}`;
};
const fmtCount = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `${n}`;

/**
 * Image-led, clearly-bookable experience card. Opens the provider's booking
 * page (new tab, affiliate-tracked URL) and fires our tracked click event so
 * experience click-through is measured like other commercial handoffs.
 *
 * Price is shown as indicative "from ₹X" — never a guaranteed total.
 */
export default function ExperienceCard({ exp }: { exp: Experience }) {
  return (
    <a
      href={exp.bookingUrl}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() =>
        trackExperienceClick({
          provider: exp.provider,
          city: exp.city,
          experienceId: exp.id,
          category: exp.category,
        })
      }
      className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-hairline bg-white shadow-soft transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-fill">
        <Image
          src={exp.image}
          alt={exp.imageAlt}
          fill
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 24vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-pill bg-white/85 px-2.5 py-1 font-body text-xs font-semibold text-navy backdrop-blur-sm">
          {exp.category}
        </span>
      </div>

      <div className="flex grow flex-col p-4">
        <h3 className="font-body text-base font-semibold leading-snug text-ink line-clamp-2">
          {exp.title}
        </h3>

        <div className="mt-2 flex items-center gap-3 font-body text-sm text-ink/60">
          {exp.rating > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-coral text-coral" aria-hidden />
              <span className="font-semibold text-ink">{exp.rating.toFixed(1)}</span>
              <span>({fmtCount(exp.reviewCount)})</span>
            </span>
          ) : null}
          {exp.duration ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden />
              {exp.duration}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between pt-1">
          <span className="font-body text-sm text-ink/60">
            from{" "}
            <span className="font-display text-lg font-semibold text-ink">
              {fmtPrice(exp.priceFrom, exp.currency)}
            </span>
            <span className="text-ink/40">*</span>
          </span>
          <span className="font-body text-sm font-semibold text-primary">
            Book →
          </span>
        </div>
      </div>
    </a>
  );
}
