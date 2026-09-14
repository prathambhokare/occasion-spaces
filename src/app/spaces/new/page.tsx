'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Sparkles, Calendar, MapPin, ShieldCheck, 
  Image as ImageIcon, Lock, ArrowLeft, Info 
} from 'lucide-react';
import Link from 'next/link';

const PRESET_COVERS = [
  { label: 'Traditional Festival (Aarti / Lights)', url: 'https://images.unsplash.com/photo-1567591414240-e9c1e59f3e06?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Royal Wedding Courtyard', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Community Parkland / Eco Drive', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cultural Artistry & Decor', url: 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=1200&q=80' },
];

export default function NewSpacePage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [occasionType, setOccasionType] = useState('festival');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [area, setArea] = useState('');
  const [venue, setVenue] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(PRESET_COVERS[0].url);
  const [visibility, setVisibility] = useState<'public' | 'location_suggested' | 'invite_only'>('public');
  const [inviteCode, setInviteCode] = useState('');
  
  // Date calculations (Default: starts today, ends in 3 days)
  const todayStr = new Date().toISOString().slice(0, 16);
  const futureStr = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
  const [startsAt, setStartsAt] = useState(todayStr);
  const [endsAt, setEndsAt] = useState(futureStr);
  
  const [postsRequireApproval, setPostsRequireApproval] = useState(false);
  const [archiveVisibility, setArchiveVisibility] = useState<'public' | 'limited' | 'private'>('public');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          occasionType,
          description,
          city,
          area,
          venue,
          coverImageUrl,
          visibility,
          inviteCode: visibility === 'invite_only' ? inviteCode : undefined,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          archiveVisibility,
          postsRequireApproval,
          createdByUserId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create occasion space');
      }

      router.push(`/spaces/${data.space.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      
      {/* Header */}
      <div className="mb-6 space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Occasions
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          Open a Temporary Occasion Space
        </h1>
        <p className="text-xs text-stone-600 dark:text-stone-400">
          Create a dedicated, respectful digital space for your cultural festival, wedding, or gathering. It will automatically archive when the celebration ends.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-stone-200 dark:border-stone-800 space-y-6">
        
        {/* Basic Occasion Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200 border-b border-stone-100 dark:border-stone-800 pb-2">
            1. Occasion Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Occasion Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ballygunge Cultural Durga Puja 2026"
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Occasion Type *
              </label>
              <select
                value={occasionType}
                onChange={(e) => setOccasionType(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              >
                <option value="festival">Cultural / Religious Festival</option>
                <option value="wedding">Wedding & Sangeet</option>
                <option value="memorial">Memorial & Tribute</option>
                <option value="community">Community Gathering</option>
                <option value="campus">College & Campus Fest</option>
                <option value="milestone">Life Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Primary City *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Mumbai, Kolkata, Jaipur"
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Area / Neighborhood *
              </label>
              <input
                type="text"
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g., Lalbaug, Ballygunge, Indiranagar"
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Specific Venue / Place (Optional)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g., Central Grounds, Rambagh Palace"
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Short Description & Cultural Purpose *
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the occasion, traditions, darshan timings, or instructions for participants..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Cover Image Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            Cover Image
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESET_COVERS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCoverImageUrl(preset.url)}
                className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  coverImageUrl === preset.url ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-stone-900/40 p-1 text-[10px] text-white flex items-end">
                  {preset.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="Or paste a custom image URL..."
            className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        {/* Duration / Lifecycle Engine (FR3) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
            <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              2. Occasion Duration & Auto-Sunset
            </h2>
            <span className="text-[11px] text-stone-400">Temporary by design</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Occasion Starts *
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Occasion Ends & Auto-Archives *
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>
          <p className="text-[11px] text-stone-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            When the end time is reached, contributions will automatically close and the space transitions into read-only archival memory.
          </p>
        </div>

        {/* Visibility & Safety Controls (FR2, FR27) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-200 border-b border-stone-100 dark:border-stone-800 pb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            3. Safety & Organizer Governance
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Space Visibility (FR2)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    visibility === 'public'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 font-semibold text-amber-950 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <span className="block font-bold">Public</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 block">Discoverable by all devotees/guests in city search</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('location_suggested')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    visibility === 'location_suggested'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 font-semibold text-amber-950 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <span className="block font-bold">Location Suggested</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 block">Visible primarily to participants in the local area</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('invite_only')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    visibility === 'invite_only'
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 font-semibold text-amber-950 dark:text-amber-200'
                      : 'border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <span className="block font-bold">Invite-Only</span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 block">Only guests with invite code or link can join</span>
                </button>
              </div>
            </div>

            {visibility === 'invite_only' && (
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
                <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Custom Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g., JAIPUR2026"
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900 uppercase font-mono tracking-wider focus:outline-hidden"
                />
              </div>
            )}

            {/* Approval Mode Toggle (FR27) */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors">
              <input
                type="checkbox"
                checked={postsRequireApproval}
                onChange={(e) => setPostsRequireApproval(e.target.checked)}
                className="mt-0.5 rounded-xs text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="text-xs font-semibold block text-stone-900 dark:text-stone-100">
                  Enable &quot;Contributions Require Approval&quot; Mode
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                  Organizers must review and approve photos and notes before they appear in the public feed. Ideal for weddings, solemn rituals, or high-stakes occasions.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Creator Identity Info */}
        <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-800 text-xs flex items-center justify-between">
          <div>
            <span className="text-stone-400 block">Opening as Organizer:</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {currentUser.displayName} ({currentUser.contactValue})
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            Verified Organizer
          </span>
        </div>

        {/* Submit */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-400"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {submitting ? 'Opening Occasion Space...' : 'Open Occasion Space'}
          </button>
        </div>

      </form>

    </div>
  );
}
