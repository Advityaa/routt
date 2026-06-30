import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import AffiliateButton from "@/components/AffiliateButton";
import ForexCalculator from "@/components/trip/ForexCalculator";
import { slugify } from "@/lib/guides";
import type { PartnerId } from "@/lib/affiliate";
import PlanCTA from "./PlanCTA";
import OfficialSource from "./OfficialSource";

/** Flatten MDX children to plain text so headings get stable ids for the ToC. */
function textOf(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = (node as any)?.props;
  return props ? textOf(props.children) : "";
}

/**
 * Long-form reading styles + the components a guide author can use inline.
 * `trackContext` (the post slug) is the default tracking destination for
 * affiliate clicks fired from this post.
 */
export function getGuideMdxComponents(trackContext: string): MDXComponents {
  return {
    h2: (props) => (
      <h2
        id={slugify(textOf(props.children))}
        className="mt-12 scroll-mt-24 font-display text-3xl font-semibold text-ink"
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        id={slugify(textOf(props.children))}
        className="mt-8 scroll-mt-24 font-display text-xl font-semibold text-navy"
        {...props}
      />
    ),
    p: (props) => (
      <p className="mt-5 font-body text-[17px] leading-[1.75] text-ink/80" {...props} />
    ),
    ul: (props) => (
      <ul className="mt-5 flex list-disc flex-col gap-2 pl-5 font-body text-[17px] leading-[1.7] text-ink/80" {...props} />
    ),
    ol: (props) => (
      <ol className="mt-5 flex list-decimal flex-col gap-2 pl-5 font-body text-[17px] leading-[1.7] text-ink/80" {...props} />
    ),
    li: (props) => <li className="marker:text-primary/50" {...props} />,
    strong: (props) => <strong className="font-semibold text-ink" {...props} />,
    blockquote: (props) => (
      <blockquote
        className="mt-6 rounded-card border-l-4 border-primary/40 bg-fill/40 px-5 py-4 font-body text-[17px] italic leading-relaxed text-navy"
        {...props}
      />
    ),
    hr: () => <hr className="my-10 border-hairline" />,
    a: ({ href = "#", children, ...rest }) => {
      const internal = href.startsWith("/") || href.startsWith("#");
      const cls =
        "font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary";
      return internal ? (
        <Link href={href} className={cls}>
          {children}
        </Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
          {children}
        </a>
      );
    },
    // In-content components:
    PlanCTA,
    OfficialSource: (props: { href: string; label: string; category?: string; destination?: string }) => (
      <OfficialSource destination={trackContext} {...props} />
    ),
    AffiliateButton: (props: { partner: PartnerId; label?: string; destination?: string }) => (
      <AffiliateButton destination={trackContext} {...props} />
    ),
    ForexCalculator: (props: { partnerId?: PartnerId }) => (
      <ForexCalculator destination={trackContext} {...props} />
    ),
  };
}
