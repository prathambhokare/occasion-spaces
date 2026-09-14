import React from 'react';
import { SpaceStatus } from '@/lib/types';
import { Radio, Clock, Calendar, Archive, Lock } from 'lucide-react';

interface StatusBadgeProps {
  status: SpaceStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, className = '', size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-xs font-medium',
    md: 'px-3 py-1 text-xs sm:text-sm font-medium',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  }[size];

  switch (status) {
    case 'live':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80 ${sizeClasses} ${className}`}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live Occasion
        </span>
      );

    case 'ending_soon':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80 ${sizeClasses} ${className}`}>
          <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
          Ending Soon
        </span>
      );

    case 'upcoming':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80 ${sizeClasses} ${className}`}>
          <Calendar className="w-3 h-3 text-sky-600" />
          Upcoming
        </span>
      );

    case 'archived':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-stone-100 text-stone-700 border border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 ${sizeClasses} ${className}`}>
          <Archive className="w-3 h-3 text-stone-500" />
          Archived & Read-Only
        </span>
      );

    case 'closed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/80 ${sizeClasses} ${className}`}>
          <Lock className="w-3 h-3 text-rose-500" />
          Closed
        </span>
      );

    default:
      return null;
  }
}
