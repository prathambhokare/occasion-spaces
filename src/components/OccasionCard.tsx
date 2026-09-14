import React from 'react';
import Link from 'next/link';
import { Space } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Users, HeartHandshake, ShieldCheck, Lock } from 'lucide-react';
import { formatTimeRemaining, formatTimeUntilStart } from '@/lib/lifecycle';

interface OccasionCardProps {
  space: Space;
}

export function OccasionCard({ space }: OccasionCardProps) {
  const status = space.status || 'live';

  const timeLabel = () => {
    if (status === 'upcoming') {
      return formatTimeUntilStart(space.startsAt);
    }
    if (status === 'live' || status === 'ending_soon') {
      return formatTimeRemaining(space.endsAt);
    }
    if (status === 'archived') {
      return 'Archived Read-Only';
    }
    return 'Occasion Closed';
  };

  const typeLabels: Record<string, string> = {
    festival: 'Sacred Festival',
    wedding: 'Wedding & Union',
    memorial: 'Memorial & Tribute',
    community: 'Community Gathering',
    campus: 'Campus & College',
    milestone: 'Life Milestone',
  };

  return (
    <div className="group flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition-all">
      
      {/* Media Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <img
          src={space.coverImageUrl}
          alt={space.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
        
        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <StatusBadge status={status} />
          <div className="flex items-center gap-1.5">
            {space.visibility === 'invite_only' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/80 backdrop-blur-xs text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Invite Only
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/70 backdrop-blur-xs text-stone-200 uppercase tracking-wider">
              {typeLabels[space.occasionType] || space.occasionType}
            </span>
          </div>
        </div>

        {/* Bottom banner info */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="text-[11px] font-medium text-amber-200 flex items-center gap-1">
            <span>{timeLabel()}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <Link href={`/spaces/${space.id}`} className="hover:underline">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-amber-600 transition-colors">
              {space.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span className="truncate">
              {space.area}, {space.city} {space.venue ? `• ${space.venue}` : ''}
            </span>
          </div>

          <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
            {space.description}
          </p>
        </div>

        {/* Metadata & Footer */}
        <div className="pt-3 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="Participants">
              <Users className="w-3.5 h-3.5" />
              {space.participantCount || 0}
            </span>
            <span className="flex items-center gap-1" title="Memories & Blessings Shared">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
              {space.contributionCount || 0}
            </span>
          </div>

          <Link
            href={`/spaces/${space.id}`}
            className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
          >
            {status === 'archived' ? 'Explore Archive →' : 'Enter Occasion →'}
          </Link>
        </div>

      </div>

    </div>
  );
}
