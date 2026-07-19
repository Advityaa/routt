"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plane, Clock, CloudRain, Sun, Cloud, Thermometer, Wind, Star, ArrowRight, PlaneTakeoff, Info } from "lucide-react";
import type { ViatorExperience } from "@/lib/experiences/viator";

export default function ArrivalPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flight, setFlight] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [experiences, setExperiences] = useState<ViatorExperience[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError("");
    setFlight(null);
    setWeather(null);
    setExperiences([]);

    try {
      // 1. Fetch Flight Data
      const flightRes = await fetch(`/api/flight?number=${encodeURIComponent(query)}`);
      if (!flightRes.ok) throw new Error("Flight not found or API key missing");
      const flightData = await flightRes.json();
      setFlight(flightData);

      // 2. Fetch Weather (if lat/lng resolved)
      if (flightData.destLat && flightData.destLng) {
        fetch(`/api/weather?lat=${flightData.destLat.toFixed(2)}&lng=${flightData.destLng.toFixed(2)}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => setWeather(data))
          .catch(console.error);
      }

      // 3. Fetch Viator Experiences
      let cityName = flightData.destName || flightData.dest; 
      if (flightData.dest === "CDG" || flightData.dest === "ORY") cityName = "Paris";
      if (flightData.dest === "BKK" || flightData.dest === "DMK") cityName = "Bangkok";
      
      const expRes = await fetch(`/api/experiences?city=${encodeURIComponent(cityName)}`);
      if (expRes.ok) {
        const expData = await expRes.json();
        setExperiences(expData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoStr: string) {
    if (!isoStr) return "--:--";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr; 
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(isoStr: string) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return ""; 
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function calculateProgress(dep: string, arr: string) {
    if (!dep || !arr) return 0;
    const now = Date.now();
    const start = new Date(dep).getTime();
    const end = new Date(arr).getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.floor(((now - start) / (end - start)) * 100);
  }

  return (
    <main className="w-full min-h-[100dvh] bg-canvas pb-28 md:pb-12">
      
      {/* Top Navigation */}
      <div className="hidden md:flex items-center justify-between px-10 py-6 border-b border-line bg-surface">
        <Link href="/" className="font-display text-[22px] font-bold text-fg">Routt</Link>
        <div className="flex gap-8 text-[14px] font-medium text-muted">
          <Link href="/experiences" className="hover:text-fg transition">Experiences</Link>
          <Link href="/arrival" className="text-fg font-semibold">Flight Tracker</Link>
          <Link href="/trip" className="hover:text-fg transition">My Trip</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 pt-8 md:pt-16">
        
        {/* Search Header */}
        {!flight && (
          <div className="text-center mb-10 animate-in fade-in duration-700">
            <h1 className="font-display text-[32px] md:text-[42px] font-bold text-fg mb-3">Track Your Flight</h1>
            <p className="text-muted text-[15px] md:text-[18px]">Enter your flight number to generate your digital boarding pass.</p>
          </div>
        )}
        
        <form onSubmit={handleSearch} className={`relative mx-auto transition-all duration-500 ${flight ? 'max-w-md mb-8' : 'max-w-xl mb-10'}`}>
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <PlaneTakeoff className="text-muted" size={20} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="e.g. EK1, BA12, TG911"
            className="w-full h-14 pl-12 pr-32 rounded-full border border-line bg-surface text-fg font-medium text-[16px] focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-sm"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-accent hover:bg-accent-deep text-white px-6 rounded-full font-semibold text-[14px] transition disabled:opacity-50 shadow-sm"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
        {error && <p className="text-center text-red-500 text-[14px] font-medium -mt-4 mb-8">{error}</p>}

        {/* Flight Dashboard / Boarding Pass */}
        {flight && (
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-700">
            
            {/* The Digital Boarding Pass */}
            <div className="max-w-md mx-auto bg-surface rounded-[28px] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-line relative mb-12">
              
              {/* Pass Header */}
              <div className="bg-[#1C1A16] px-8 py-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10 translate-x-4 -translate-y-4">
                  <Plane size={120} className="rotate-45" />
                </div>
                <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 shadow-lg shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`https://images.kiwi.com/airlines/128/${flight.airline}.png`} 
                        alt={flight.airline} 
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                    <div>
                      <p className="text-white/60 font-mono text-[11px] uppercase tracking-widest mb-1">Airline</p>
                      <h2 className="font-display font-semibold text-[22px] leading-none">{flight.airline}</h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 font-mono text-[11px] uppercase tracking-widest mb-1">Flight No</p>
                    <h2 className="font-sans font-bold text-[22px] leading-none text-accent">{flight.flightNumber}</h2>
                  </div>
                </div>
              </div>

              {/* Pass Body (Main Flight Info) */}
              <div className="px-8 pt-8 pb-10">
                <div className="flex justify-between items-center relative">
                  
                  {/* Origin */}
                  <div className="w-[80px]">
                    <h1 className="font-display font-bold text-[48px] text-fg leading-none tracking-tight">{flight.origin}</h1>
                    <p className="text-[20px] font-semibold text-fg mt-2 leading-none">{formatTime(flight.depTime)}</p>
                    <p className="text-muted text-[13px] font-medium mt-1">{formatDate(flight.depTime)}</p>
                    <div className="mt-4 flex gap-3 text-[12px] font-mono text-fg uppercase">
                      <div><span className="text-muted block text-[10px]">Gate</span>{flight.originGate}</div>
                      <div><span className="text-muted block text-[10px]">Term</span>{flight.originTerminal}</div>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="flex-1 px-4 relative flex flex-col items-center">
                    <div className="text-[11px] font-semibold text-muted uppercase tracking-widest mb-3 bg-canvas px-2 rounded-full border border-line">
                      {Math.floor(flight.duration / 60)}H {flight.duration % 60}M
                    </div>
                    <div className="w-full h-[3px] bg-line rounded-full relative">
                      <div 
                        className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-1000" 
                        style={{ width: `${calculateProgress(flight.depTime, flight.arrTime)}%` }} 
                      />
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 bg-surface p-1 rounded-full border border-line shadow-sm transition-all duration-1000 z-10"
                        style={{ left: `calc(${calculateProgress(flight.depTime, flight.arrTime)}% - 14px)` }}
                      >
                        <Plane className="text-accent rotate-90" size={16} />
                      </div>
                    </div>
                    <div className="text-[11px] font-bold mt-4 uppercase tracking-wider px-3 py-1 rounded-full bg-green-500/10 text-green-600">
                      {flight.status}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="w-[80px] text-right">
                    <h1 className="font-display font-bold text-[48px] text-fg leading-none tracking-tight">{flight.dest}</h1>
                    <p className="text-[20px] font-semibold text-fg mt-2 leading-none">{formatTime(flight.arrTime)}</p>
                    <p className="text-muted text-[13px] font-medium mt-1">{formatDate(flight.arrTime)}</p>
                    <div className="mt-4 flex gap-3 text-[12px] font-mono text-fg uppercase justify-end">
                      <div><span className="text-muted block text-[10px]">Gate</span>{flight.destGate}</div>
                      <div><span className="text-muted block text-[10px]">Term</span>{flight.destTerminal}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perforation Divider */}
              <div className="relative border-t-[2px] border-dashed border-line mx-4">
                <div className="absolute -left-7 -top-3 w-6 h-6 bg-canvas rounded-full shadow-[inset_-3px_0_4px_-1px_rgba(0,0,0,0.08)]" />
                <div className="absolute -right-7 -top-3 w-6 h-6 bg-canvas rounded-full shadow-[inset_3px_0_4px_-1px_rgba(0,0,0,0.08)]" />
              </div>

              {/* Pass Footer / Ticket Stub */}
              <div className="bg-canvas/50 px-8 py-6 flex justify-between items-center">
                
                {/* Aircraft Specs */}
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 bg-white border border-line rounded-xl flex items-center justify-center shadow-sm">
                    <Info size={18} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-0.5">Aircraft</p>
                    <p className="font-semibold text-[13px] text-fg">{flight.aircraft}</p>
                  </div>
                </div>

                {/* Weather at Destination */}
                {weather ? (
                  <div className="flex gap-3 items-center">
                    <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shadow-sm">
                      {weather.condition?.toLowerCase().includes("rain") ? <CloudRain size={18} className="text-blue-500" /> : 
                       weather.condition?.toLowerCase().includes("cloud") ? <Cloud size={18} className="text-blue-500" /> : 
                       <Sun size={18} className="text-yellow-500" />}
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[10px] text-muted uppercase tracking-widest mb-0.5">{flight.destName}</p>
                      <p className="font-semibold text-[13px] text-fg">{weather.tempC}°C · {weather.condition}</p>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse bg-line h-8 w-24 rounded-md" />
                )}

              </div>
            </div>

            {/* Viator Cross-Sell Section */}
            {experiences.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 mt-16 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display text-[26px] font-bold text-fg leading-tight">
                      Welcome to {flight.destName || flight.dest}
                    </h2>
                    <p className="text-muted text-[15px] mt-1">Book highly-rated experiences the moment you land.</p>
                  </div>
                  <a href="#" className="hidden md:flex items-center gap-1 text-[14px] font-semibold text-accent hover:underline">
                    View all <ArrowRight size={16} />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {experiences.map((exp) => (
                    <a key={exp.id} href={exp.url} className="group flex flex-col gap-3 bg-surface p-3 rounded-3xl border border-line hover:shadow-xl transition-all duration-300">
                      <div className="relative aspect-square rounded-[20px] overflow-hidden bg-elevate">
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                          style={{ backgroundImage: `url(${exp.image})` }} 
                        />
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                          <Star size={12} className="fill-accent text-accent" />
                          <span className="text-[12px] font-bold text-fg">{exp.rating}</span>
                        </div>
                      </div>
                      <div className="px-2 pb-2">
                        <h3 className="font-semibold text-[15px] text-fg leading-snug group-hover:text-accent transition line-clamp-2">{exp.title}</h3>
                        <p className="text-[14px] text-muted mt-2">from <strong className="text-fg">${exp.price}</strong></p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
