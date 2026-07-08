import { NextResponse } from "next/server";
import { submitReview, reportReview, rollupSignals, publicTips } from "@/lib/ugc/store";

/**
 * First-party UGC endpoints.
 *  GET  /api/contribute?gers_id=…   → { signals, tips }  (honest counts, real only)
 *  POST /api/contribute             → submit a contribution (auth-lite: anon user_id
 *                                     required; rate-limited; filtered) or, with
 *                                     { action: "report", review_id }, flag content.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const gersId = new URL(req.url).searchParams.get("gers_id");
  if (!gersId) return NextResponse.json({ error: "missing gers_id" }, { status: 400 });
  return NextResponse.json({ signals: rollupSignals(gersId), tips: publicTips(gersId) });
}

export async function POST(req: Request): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.action === "report") {
    const ok = reportReview(String(body.review_id ?? ""));
    return NextResponse.json(ok ? { ok: true } : { error: "not found" }, { status: ok ? 200 : 404 });
  }

  const res = submitReview({
    gers_id: String(body.gers_id ?? ""),
    user_id: String(body.user_id ?? ""),
    handle: typeof body.handle === "string" ? body.handle : undefined,
    quick: ["still-good", "not-what-it-was", "closed"].includes(String(body.quick))
      ? (body.quick as "still-good" | "not-what-it-was" | "closed")
      : undefined,
    rating: typeof body.rating === "number" ? body.rating : undefined,
    text: typeof body.text === "string" ? body.text : undefined,
    is_local: Boolean(body.is_local),
    price_paid: typeof body.price_paid === "number" ? body.price_paid : undefined,
    // photo_url intentionally not accepted from clients yet — photos will go
    // through our own upload + moderation queue, never hotlinked user URLs.
  });

  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 429 });
  return NextResponse.json({ ok: true, signals: rollupSignals(res.review.gers_id) });
}
