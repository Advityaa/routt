"use client";

import Link from "next/link";
import { Search, MapPin, Plane, Compass } from "lucide-react";

const MOCK_DESTINATIONS = [
  { name: "Paris, France", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600" },
  { name: "Tokyo, Japan", image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=600" },
  { name: "Rome, Italy", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=600" },
  { name: "Bali, Indonesia", image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=600" },
];

export default function Home() {
  return (
    <main className="w-full min-h-[100dvh] bg-canvas pb-28 md:pb-0">
      {/* Massive Desktop-Friendly Hero */}
      <section className="relative h-[60vh] md:h-[75vh] w-full overflow-hidden bg-[#24201a]">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=2000)` }} 
        />
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Top Desktop Navigation */}
        <div className="relative z-[2] hidden md:flex items-center justify-between px-10 pt-8 max-w-7xl mx-auto">
          <span className="font-display text-[28px] font-bold tracking-tight text-white">Routt</span>
          <div className="flex gap-8 text-[15px] font-medium text-white/90">
            <Link href="/experiences" className="hover:text-white transition">Experiences</Link>
            <Link href="/arrival" className="hover:text-white transition">Flight Tracker</Link>
            <Link href="/trip" className="hover:text-white transition">My Trip</Link>
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="relative z-[2] md:hidden flex items-center justify-between px-5 pt-8">
          <span className="font-display text-[24px] font-bold tracking-tight text-white">Routt</span>
        </div>

        {/* Hero Content & Search */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center z-[2]">
          <h1 className="font-display text-[42px] md:text-[64px] font-bold text-white leading-[1.1] max-w-3xl drop-shadow-lg">
            Track your flight.<br/>Book your adventure.
          </h1>
          <p className="mt-4 text-[16px] md:text-[20px] text-white/90 font-medium max-w-xl drop-shadow-md">
            Enter your destination or flight number to discover top-rated local experiences.
          </p>

          {/* Search Bar */}
          <div className="mt-10 w-full max-w-2xl bg-white rounded-full p-2 md:p-3 flex items-center shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3 pl-4 pr-2 flex-1">
              <Search size={22} className="text-muted" strokeWidth={2} />
              <input 
                type="text" 
                placeholder="Where are you flying to?" 
                className="w-full bg-transparent border-none outline-none text-[16px] md:text-[18px] text-fg font-medium placeholder:text-muted"
              />
            </div>
            <button className="bg-accent hover:bg-accent-deep text-white px-6 md:px-10 py-3 md:py-4 rounded-full font-semibold text-[15px] md:text-[16px] transition-colors shadow-sm">
              Explore
            </button>
          </div>
        </div>
      </section>
      
      {/* Trending Destinations Grid */}
      <section className="max-w-7xl mx-auto px-5 py-16 md:py-24">
        <h2 className="font-display text-[32px] md:text-[42px] font-bold text-fg mb-10">Trending Destinations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_DESTINATIONS.map((dest, i) => (
            <Link href="/experiences" key={i} className="group relative h-[300px] md:h-[400px] w-full rounded-[24px] overflow-hidden bg-elevate block">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${dest.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="font-display text-[24px] font-bold text-white leading-tight">{dest.name}</h3>
                <p className="text-white/80 text-[14px] font-medium mt-1 group-hover:text-white transition flex items-center gap-1">
                  Explore experiences <Plane size={14} className="rotate-90" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
