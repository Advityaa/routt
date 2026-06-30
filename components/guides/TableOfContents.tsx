import type { GuideHeading } from "@/lib/guides";

/** In-post table of contents for long pillar pages. Built from h2/h3 ids. */
export default function TableOfContents({ headings }: { headings: GuideHeading[] }) {
  const items = headings.filter((h) => h.level === 2 || h.level === 3);
  if (items.length < 3) return null;

  return (
    <nav
      aria-label="On this page"
      className="my-8 rounded-card border border-hairline bg-fill/30 px-5 py-4"
    >
      <p className="font-body text-xs font-semibold uppercase tracking-wider text-primary/70">
        On this page
      </p>
      <ul className="mt-3 space-y-1.5">
        {items.map((h) => (
          <li key={h.id} className={h.level === 3 ? "ml-4" : ""}>
            <a
              href={`#${h.id}`}
              className="font-body text-sm text-ink/70 hover:text-navy"
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
