'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  HeartHandshake, Calendar, Download, Sparkles, 
  MapPin, Shield, Clock, Trash2, ArrowLeft, 
  UserCheck, Lock, ExternalLink, RefreshCw 
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface UserHistoryData {
  spaces: Array<{
    id: string;
    name: string;
    slug: string;
    occasionType: string;
    description: string;
    city: string;
    area: string;
    startsAt: string;
    endsAt: string;
    status: any;
    myRole: string;
    joinedAt: string;
    coverImageUrl: string;
  }>;
  contributions: Array<{
    id: string;
    spaceId: string;
    type: string;
    mediaUrl?: string;
    caption: string;
    status: string;
    celebrationCount: number;
    createdAt: string;
    spaceName: string;
  }>;
}

export default function MyOccasionsPage() {
  const { currentUser, switchUserById, allUsers } = useAuth();
  
  const [history, setHistory] = useState<UserHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'spaces' | 'contributions'>('spaces');
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/history?userId=${currentUser.id}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.history);
      }

      const blockRes = await fetch(`/api/users/block?userId=${currentUser.id}`);
      const blockData = await blockRes.json();
      if (blockRes.ok) {
        setBlockedUserIds(blockData.blockedUserIds || []);
      }
    } catch (err) {
      console.error('Failed to load user history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser.id]);

  const handleExportMyData = () => {
    window.location.href = `/api/export?type=user&id=${currentUser.id}`;
  };

  const handleUnblock = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUserId }),
      });
      if (res.ok) {
        setBlockedUserIds((prev) => prev.filter((id) => id !== targetUserId));
      }
    } catch (err) {
      console.error('Failed to unblock user:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Header & Occasion Philosophy Banner (FR24, FR25) */}
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore Occasions
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
              <Calendar className="w-7 h-7 text-amber-500" />
              My Occasions & Memories
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Private to you (FR25). In Occasion Spaces, your identity is occasion-first. There are no public follower graphs or permanent public feeds.
            </p>
          </div>

          {/* Export Personal Archive (FR36) */}
          <button
            onClick={handleExportMyData}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2 shrink-0 self-start sm:self-auto"
            title="Download personal JSON export of your contributions across all occasions"
          >
            <Download className="w-4 h-4" />
            Export My Memories (JSON)
          </button>
        </div>
      </div>

      {/* Persona Context Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-lg flex items-center justify-center">
            {currentUser.displayName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                {currentUser.displayName}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Verified {currentUser.contactType}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {currentUser.contactValue} • Role: {currentUser.role === 'platform_moderator' ? 'Safety Moderator' : 'Participant'}
            </p>
          </div>
        </div>

        {/* Quick persona switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-stone-400 hidden md:inline">Test as Persona:</span>
          <select
            value={currentUser.id}
            onChange={(e) => switchUserById(e.target.value)}
            className="text-xs p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 focus:outline-hidden"
          >
            {allUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={() => setActiveTab('spaces')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'spaces'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Joined Occasions ({history?.spaces.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('contributions')}
          className={`pb-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'contributions'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          My Memories & Blessings ({history?.contributions.length || 0})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          ))}
        </div>
      ) : activeTab === 'spaces' ? (
        <div className="space-y-4">
          {history?.spaces && history.spaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.spaces.map((sp) => (
                <div
                  key={sp.id}
                  className="group bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative h-32 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={sp.coverImageUrl}
                      alt={sp.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform"
                    />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <StatusBadge status={sp.status || 'live'} />
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/80 backdrop-blur-xs text-stone-200 uppercase">
                        {sp.myRole === 'organizer' ? '👑 Organizer' : 'Participant'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <Link href={`/spaces/${sp.id}`} className="hover:underline">
                        <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors">
                          {sp.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                        <MapPin className="w-3 h-3 text-amber-600" />
                        <span>{sp.area}, {sp.city}</span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {sp.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
                      <span>Joined {new Date(sp.joinedAt).toLocaleDateString()}</span>
                      <Link
                        href={`/spaces/${sp.id}`}
                        className="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700"
                      >
                        Enter Space →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
              <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                You haven&apos;t joined any occasion spaces yet
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore active community gatherings and cultural festivals in your city.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs mt-2"
              >
                Discover Occasions
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {history?.contributions && history.contributions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.contributions.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  {c.mediaUrl && (
                    <div className="h-40 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                      <img src={c.mediaUrl} alt={c.caption} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {c.spaceName}
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed italic">
                        &quot;{c.caption}&quot;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-rose-500" />
                        {c.celebrationCount} celebrations
                      </span>
                      <Link
                        href={`/spaces/${c.spaceId}`}
                        className="text-amber-600 hover:underline text-[11px]"
                      >
                        View in Space
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
              <HeartHandshake className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                No memories contributed yet
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Join an active occasion space to share prayers, blessings, or moments.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Blocked Users Section (FR32) */}
      <div className="p-6 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            Safety & Blocked Users (FR32)
          </h3>
          <span className="text-stone-400">{blockedUserIds.length} blocked</span>
        </div>
        <p className="text-stone-500 leading-relaxed">
          When you block a user, their contributions are filtered out from your view in all occasion spaces.
        </p>

        {blockedUserIds.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {blockedUserIds.map((userId) => (
              <div
                key={userId}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center gap-2 text-xs"
              >
                <span>Blocked User: {userId}</span>
                <button
                  onClick={() => handleUnblock(userId)}
                  className="text-amber-600 hover:text-amber-700 font-semibold"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-stone-400 italic">
            You currently have no blocked users.
          </p>
        )}
      </div>

    </div>
  );
}

