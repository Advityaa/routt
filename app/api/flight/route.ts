import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const num = q.get("number")?.replace(/\s/g, "").toUpperCase();
  
  if (!num) return NextResponse.json({ error: "Flight number required" }, { status: 400 });
  
  const key = process.env.AIRLABS_API_KEY;
  if (!key) return NextResponse.json({ error: "Airlabs API key not configured" }, { status: 503 });

  try {
    const res = await fetch(`https://airlabs.co/api/v9/schedules?flight_iata=${num}&api_key=${key}`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Airlabs error: ${res.status}`);

    const data = await res.json();
    
    if (!data.response || data.response.length === 0) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 });
    }

    const flight = data.response[0];

    // Fetch Destination Airport Details for coordinates (used for Weather)
    let destLat = null;
    let destLng = null;
    let destCity = flight.arr_iata;
    
    try {
      const airportRes = await fetch(`https://airlabs.co/api/v9/airports?iata_code=${flight.arr_iata}&api_key=${key}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (airportRes.ok) {
        const airportData = await airportRes.json();
        if (airportData.response && airportData.response.length > 0) {
          destLat = airportData.response[0].lat;
          destLng = airportData.response[0].lng;
          destCity = airportData.response[0].city || airportData.response[0].name;
        }
      }
    } catch (e) {
      console.warn("Could not fetch airport data", e);
    }

    // Aircraft Mocking (Airlabs schedules often omit tail numbers for future flights)
    const airline = flight.airline_iata;
    let aircraft = "Boeing 737-800";
    if (airline === "EK" || airline === "QR" || airline === "EY") aircraft = "Airbus A380 / A350";
    if (airline === "BA" || airline === "VS") aircraft = "Boeing 777-300ER";
    if (flight.aircraft_icao) aircraft = flight.aircraft_icao;

    return NextResponse.json({
      flightNumber: flight.flight_iata || num,
      airline: flight.airline_iata,
      origin: flight.dep_iata,
      originTerminal: flight.dep_terminal || "-",
      originGate: flight.dep_gate || "-",
      dest: flight.arr_iata,
      destName: destCity,
      destLat,
      destLng,
      destTerminal: flight.arr_terminal || "-",
      destGate: flight.arr_gate || "-",
      depTime: flight.dep_time || flight.dep_estimated,
      arrTime: flight.arr_time || flight.arr_estimated,
      status: flight.status || "scheduled",
      duration: flight.duration,
      aircraft,
      source: "Airlabs",
    });
  } catch (error) {
    console.error("Flight tracking error:", error);
    return NextResponse.json({ error: "Flight lookup failed" }, { status: 502 });
  }
}
