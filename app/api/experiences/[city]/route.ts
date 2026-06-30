import { NextResponse } from "next/server";
import { getExperiences } from "@/lib/experiences";

/**
 * Server-side experiences endpoint. Lets the client fetch near-fresh, already
 * normalized experiences without ever seeing a provider API key (keys stay in
 * the adapter, server-side). Used for API-mode client refresh / future needs.
 */
export async function GET(
  _req: Request,
  { params }: { params: { city: string } }
) {
  const experiences = await getExperiences(params.city);
  return NextResponse.json(
    { experiences },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=600" } }
  );
}
