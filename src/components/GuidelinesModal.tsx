'use client';

import React from 'react';
import { ShieldCheck, Heart, Sparkles, Clock, AlertTriangle, X } from 'lucide-react';

interface GuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
  occasionName: string;
  occasionType?: string;
}

export function GuidelinesModal({
  isOpen,
  onClose,
  onAcknowledge,
  occasionName,
  occasionType = 'festival',
}: GuidelinesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        
        {/* Header Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/40 p-5 border-b border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Community Guidelines
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Respecting &quot;{occasionName}&quot;
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
              aria-label="Close guidelines"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 space-y-4 text-sm text-stone-700 dark:text-stone-300">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            This space is created for a shared occasion. Before adding your first memory or blessing, please confirm your commitment to the following principles:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <Heart className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                  1. Respect the Cultural & Sacred Nature
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Occasion spaces carry emotional, familial, or religious weight. Avoid provocative, derogatory, or mocking commentary.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                  2. Relevant to This Celebration Only
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Share photos, video clips, and notes specifically related to this event. No commercial spam, promo codes, or unrelated marketing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <Clock className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                  3. Temporary & Occasion-Scoped
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  This is not a permanent public profile. When the occasion concludes, this space closes and transitions into read-only memory.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-xs">
                  4. Zero Tolerance for Harassment or Hate
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  Space organizers and platform moderators actively review flagged reports. Abusive behavior leads to an immediate space ban.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900/80 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onAcknowledge}
            className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            I Acknowledge & Agree
          </button>
        </div>

      </div>
    </div>
  );
}
