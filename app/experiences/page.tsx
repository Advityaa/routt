import Link from "next/link";
import { Search, MapPin, Plane, Compass, Star, ArrowRight } from "lucide-react";
import { getExperiencesForCity } from "@/lib/experiences/viator";

// Server Component (Optimized for SEO and load speed)
export default async function ExperiencesPage() {
  
  // Fetch real data from Viator concurrently
  const [parisExps, romeExps, bkkExps] = await Promise.all([
    getExperiencesForCity("Paris", 4),
    getExperiencesForCity("Rome", 4),
    getExperiencesForCity("Bangkok", 4)
  ]);

  return (
    <main className="w-full min-h-[100dvh] bg-canvas pb-28 md:pb-0">
      
      {/* Massive Desktop-Friendly Hero */}
      <section className="relative h-[55vh] md:h-[65vh] w-full overflow-hidden bg-[#24201a]">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=2000)` }} 
        />
        <div className="absolute inset-0 bg-black/50" />
        
        {/* Top Desktop Navigation */}
        <div className="relative z-[2] hidden md:flex items-center justify-between px-10 pt-8 max-w-7xl mx-auto">
          <Link href="/" className="font-display text-[28px] font-bold tracking-tight text-white">Routt</Link>
          <div className="flex gap-8 text-[15px] font-medium text-white/90">
            <Link href="/experiences" className="text-white font-semibold">Experiences</Link>
            <Link href="/arrival" className="hover:text-white transition">Flight Tracker</Link>
            <Link href="/trip" className="hover:text-white transition">My Trip</Link>
          </div>
        </div>

        {/* Mobile Logo */}
        <div className="relative z-[2] md:hidden flex items-center justify-between px-5 pt-8">
          <Link href="/" className="font-display text-[24px] font-bold tracking-tight text-white">Routt</Link>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center z-[2]">
          <h1 className="font-display text-[48px] md:text-[72px] font-bold text-white leading-[1.1] max-w-4xl drop-shadow-2xl tracking-tight">
            Explore the World.
          </h1>
          <p className="mt-6 text-[18px] md:text-[22px] text-white/90 font-medium max-w-2xl drop-shadow-md">
            Discover and book the most highly-rated experiences in the world's most popular countries.
          </p>
        </div>
      </section>

      {/* Popular Destinations Content */}
      <div className="max-w-7xl mx-auto px-5 py-16 md:py-24 flex flex-col gap-24">
        
        {/* Section 1: France */}
        <DestinationSection 
          title="Trending in France" 
          subtitle="From the Eiffel Tower to the Palace of Versailles"
          city="Paris"
          experiences={parisExps}
        />

        {/* Section 2: Italy */}
        <DestinationSection 
          title="Magic of Italy" 
          subtitle="Explore ancient ruins and Vatican City"
          city="Rome"
          experiences={romeExps}
        />

        {/* Section 3: Thailand */}
        <DestinationSection 
          title="Adventure in Thailand" 
          subtitle="Floating markets and ancient temples"
          city="Bangkok"
          experiences={bkkExps}
        />

      </div>
    </main>
  );
}

// Reusable component for displaying a grid of Viator Experiences
function DestinationSection({ title, subtitle, city, experiences }: { title: string, subtitle: string, city: string, experiences: any[] }) {
  if (!experiences || experiences.length === 0) return null;

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-[32px] md:text-[42px] font-bold text-fg leading-tight">{title}</h2>
          <p className="text-[16px] md:text-[18px] text-muted mt-2 font-medium">{subtitle}</p>
        </div>
        <Link href={`#${city}`} className="flex items-center gap-2 text-accent font-semibold hover:underline text-[15px]">
          View all in {city} <ArrowRight size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {experiences.map((exp) => (
          <a key={exp.id} href={exp.url} className="group flex flex-col gap-3 bg-surface p-3.5 rounded-[24px] border border-line hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300">
            <div className="relative aspect-square rounded-[16px] overflow-hidden bg-elevate">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ backgroundImage: `url(${exp.image})` }} 
              />
              <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                <Star size={13} className="fill-accent text-accent" />
                <span className="text-[13px] font-bold text-fg">{exp.rating}</span>
                <span className="text-[11px] font-medium text-muted">({exp.reviews})</span>
              </div>
            </div>
            <div className="px-2 pb-2 pt-1 flex flex-col flex-1">
              <h3 className="font-semibold text-[16px] text-fg leading-snug group-hover:text-accent transition line-clamp-2">{exp.title}</h3>
              <div className="mt-auto pt-3">
                <p className="text-[15px] text-muted font-medium">from <strong className="text-fg text-[17px]">${exp.price}</strong></p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
