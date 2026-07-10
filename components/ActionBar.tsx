"use client";

import { useState } from "react";
import { MapPin, Car, Bookmark } from "lucide-react";
import { savePlace } from "@/lib/savedTrip";

/** ActionBar — the reusable in-context handoff row for every card type.
 *  Map pin → maps deep-link; cab → country's ride app with destination
 *  prefilled (TH/SG: Grab, AE: Uber/Careem territory via universal link,
 *  else: maps directions fallback); save → My Trip. All handoffs — never
 *  in-app payment. */
export const mapUrl = (lat: number, lng: number, name?: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name ? `${name}` : "")}%20@${lat},${lng}`.replace("%20@", name ? "&query_place=" : "") || `https://maps.google.com/?q=${lat},${lng}`;
export function rideUrl(country: string, lat: number, lng: number): string {
  if (country === "TH" || country === "SG")
    return `grab://open?screenType=BOOKING&dropOffLatitude=${lat}&dropOffLongitude=${lng}`;
  if (country === "AE")
    return `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`; // graceful fallback
}

export default function ActionBar({ lat, lng, name, gersId, country, className = "" }: {
  lat: number; lng: number; name: string; gersId?: string; country: string; className?: string;
}) {
  const [saved, setSaved] = useState(false);
  return (
    <span className={`flex items-center gap-3 text-muted ${className}`}>
      <a aria-label={`View ${name} on map`} href={`https://maps.google.com/?q=${lat},${lng}`} target="_blank" rel="noreferrer" className="hover:text-fg"><MapPin size={15} /></a>
      <a aria-label={`Get a cab to ${name}`} href={rideUrl(country, lat, lng)} target="_blank" rel="noreferrer" className="hover:text-fg"><Car size={15} /></a>
      {gersId ? (
        <button aria-label={`Save ${name} to trip`} onClick={() => { savePlace(gersId); setSaved(true); }} className={saved ? "text-accent" : "hover:text-fg"}>
          <Bookmark size={15} fill={saved ? "currentColor" : "none"} />
        </button>
      ) : null}
    </span>
  );
}
