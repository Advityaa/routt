import WorldShell from "@/components/WorldShell";

/** Scaffold host for the worlds shell — legacy screens stay live in parallel;
 *  each world migrates in here (or to /worlds/[id]) one at a time. */
export default function WorldsPage() {
  return (
    <WorldShell>
      <p className="px-5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
        Worlds scaffold · legacy screens unchanged
      </p>
    </WorldShell>
  );
}
