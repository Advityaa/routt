import type { MDXComponents } from "mdx/types";
import AffiliateButton from "./AffiliateButton";
import Checklist from "./Checklist";
import type { PartnerId } from "@/lib/affiliate";

/**
 * Styling + components available inside every playbook MDX file. Headings,
 * prose, and lists are styled here so all playbooks render identically — the
 * page template owns the look, writers own the words.
 */
export function getMdxComponents(destination: string): MDXComponents {
  return {
    h2: (props) => (
      <h2
        className="mt-12 scroll-mt-24 border-t border-hairline pt-8 font-display text-3xl font-semibold text-ink first:mt-0 first:border-0 first:pt-0"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className="mt-7 font-display text-xl font-semibold text-navy"
        {...props}
      />
    ),
    p: (props) => (
      <p
        className="mt-4 font-body text-base leading-relaxed text-ink/75"
        {...props}
      />
    ),
    ul: (props) => (
      <ul
        className="mt-4 flex flex-col gap-2 font-body text-base text-ink/75"
        {...props}
      />
    ),
    ol: (props) => (
      <ol
        className="mt-4 flex list-decimal flex-col gap-2 pl-5 font-body text-base text-ink/75"
        {...props}
      />
    ),
    li: (props) => (
      <li className="leading-relaxed marker:text-primary/60" {...props} />
    ),
    strong: (props) => (
      <strong className="font-semibold text-ink" {...props} />
    ),
    a: (props) => (
      <a
        className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="mt-5 rounded-card border border-hairline bg-fill/40 px-5 py-4 font-body text-base italic text-navy"
        {...props}
      />
    ),
    // Custom components writers can drop into a playbook:
    Checklist,
    AffiliateButton: (props: { partner: PartnerId; label?: string }) => (
      <AffiliateButton {...props} destination={destination} />
    ),
  };
}
