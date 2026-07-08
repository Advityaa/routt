"use client";

import type { Category } from "@/lib/types";

/**
 * CategoryPills — the Eat/Drink/Shop/See filter on the single ranked feed.
 * One engine, many categories: these are just tags on the same list, never
 * separate screens. Active pill is high-contrast (bone fill); color stays out
 * of it so verdicts remain the only saturated thing on screen.
 */
const CATEGORIES: { value: Category; label: string }[] = [
  { value: "eat", label: "Eat" },
  { value: "drink", label: "Drink" },
  { value: "shop", label: "Shop" },
  { value: "see", label: "See" },
];

export interface CategoryPillsProps {
  value: Category;
  onChange: (next: Category) => void;
  className?: string;
}

export default function CategoryPills({ value, onChange, className = "" }: CategoryPillsProps) {
  return (
    <div role="tablist" aria-label="Category" className={`flex gap-2 ${className}`}>
      {CATEGORIES.map((c) => {
        const active = c.value === value;
        return (
          <button
            key={c.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c.value)}
            className={`h-9 px-4 rounded-pill font-sans text-[14px] font-semibold transition ${
              active
                ? "bg-fg text-canvas"
                : "bg-transparent text-muted border border-line hover:text-fg hover:border-fg/30"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
