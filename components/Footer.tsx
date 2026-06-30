import Link from "next/link";

/**
 * Footer carries the affiliate disclosure (FTC + India ASCI style). This is a
 * hard requirement — every affiliate link in the product is covered by it.
 */
export default function Footer() {
  return (
    <footer className="mt-24 border-t border-hairline bg-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center font-display text-xl font-semibold text-navy"
            >
              Routt
            </Link>
            <p className="mt-3 font-body text-sm leading-relaxed text-ink/60">
              Honest, first-trip playbooks for Indian travellers heading abroad.
              Get connected, carry money right, and skip the rookie mistakes.
            </p>
          </div>
          <div className="font-body text-sm">
            <p className="mb-3 font-semibold text-ink">Explore</p>
            <ul className="text-ink/70">
              <li>
                <Link
                  href="/canvas"
                  className="inline-flex min-h-[44px] items-center hover:text-navy"
                >
                  My Canvas
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="inline-flex min-h-[44px] items-center hover:text-navy"
                >
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/#destinations"
                  className="inline-flex min-h-[44px] items-center hover:text-navy"
                >
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/#how"
                  className="inline-flex min-h-[44px] items-center hover:text-navy"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/#email"
                  className="inline-flex min-h-[44px] items-center hover:text-navy"
                >
                  Get the guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-card border border-hairline bg-fill/40 px-5 py-4">
          <p className="font-body text-xs leading-relaxed text-ink/60">
            <span className="font-semibold text-ink/80">
              Affiliate disclosure:
            </span>{" "}
            Some links on Routt are affiliate links. If you buy or sign up
            through them, we may earn a commission at no extra cost to you. It
            never changes which products we recommend — we only suggest what we
            genuinely believe works best for a first-time traveller. This is
            disclosed in line with FTC guidelines and India&apos;s ASCI
            influencer-advertising rules.
          </p>
        </div>

        <p className="mt-8 font-body text-xs text-ink/40">
          © {2026} Routt. Built for first-timers.
        </p>
      </div>
    </footer>
  );
}
