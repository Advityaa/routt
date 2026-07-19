import { NextResponse } from "next/server";
import { getExperiencesForCity } from "@/lib/experiences/viator";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const city = q.get("city");
  
  if (!city) return NextResponse.json({ error: "City required" }, { status: 400 });
  
  try {
    const experiences = await getExperiencesForCity(city);
    return NextResponse.json(experiences);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load experiences" }, { status: 500 });
  }
}
