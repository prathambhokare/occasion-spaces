'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Space } from '@/lib/types';
import { OccasionCard } from '@/components/OccasionCard';
import { 
  Search, Sparkles, MapPin, Plus, Flame, 
  Calendar, Archive, ShieldCheck, Heart
} from 'lucide-react';

const CITIES = ['All', 'Mumbai', 'Jaipur', 'Kolkata', 'Bengaluru'];
const OCCASION_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'festival', label: 'Festivals' },
  { id: 'wedding', label: 'Weddings' },
  { id: 'community', label: 'Community' },
];

const STATUS_TABS = [
  { id: 'live', label: 'Live Now' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'archived', label: 'Archived Memories' },
  { id: 'all', label: 'All Occasions' },
];

export default function HomePage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('live');

  const fetchSpaces = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity !== 'All') params.set('city', selectedCity);
      if (selectedType !== 'all') params.set('occasionType', selectedType);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (searchQuery.trim()) params.set('query', searchQuery.trim());

      const res = await fetch(`/api/spaces?${params.toString()}`);
      const data = await res.json();
      if (data.spaces) {
        setSpaces(data.spaces);
      }
    } catch (err) {
      console.error('Failed to load occasion spaces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [selectedCity, selectedType, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSpaces();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Hero / Occasion-First Manifesto Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white p-6 sm:p-10 shadow-lg border border-stone-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Occasion Over Person • Temporary by Design</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Shared digital spaces for real-world cultural moments.
          </h1>

          <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-normal">
            Gather memories, blessings, and photos during festivals, weddings, and community occasions. 
            No follower games, no permanent public profiles, and no algorithmic feeds. When the occasion ends, the space gently archives.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href="/spaces/new"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Open an Occasion Space
            </Link>
            
            <a
              href="#explore"
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs sm:text-sm font-medium transition-colors"
            >
              Explore Active Occasions ↓
            </a>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 -mb-20 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Discovery & Search Bar (FR40, FR41) */}
      <div id="explore" className="space-y-5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800 self-start">
            {STATUS_TABS.map((tab) => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatus(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by occasion name or area..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </form>

        </div>

        {/* City Filter Pills (FR41) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-stone-400 font-medium flex items-center gap-1 shrink-0">
            <MapPin className="w-3.5 h-3.5 text-amber-600" /> City:
          </span>
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={`px-3 py-1 rounded-full border transition-colors shrink-0 ${
                selectedCity === city
                  ? 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-200 font-semibold'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
              }`}
            >
              {city === 'All' ? 'All Cities' : city}
            </button>
          ))}
        </div>

      </div>

      {/* Occasion Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          ))}
        </div>
      ) : spaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <OccasionCard key={space.id} space={space} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            No active occasion spaces found
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Try adjusting your search query, switching city filters, or open a new occasion space for your festival or gathering.
          </p>
          <div className="pt-2">
            <Link
              href="/spaces/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Open an Occasion Space
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
