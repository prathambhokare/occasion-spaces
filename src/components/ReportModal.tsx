'use client';

import React, { useState } from 'react';
import { Flag, AlertOctagon, X, CheckCircle2 } from 'lucide-react';
import { ReportCategory } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contributionId: string;
  spaceId: string;
  contributionCaption?: string;
  authorName?: string;
}

const CATEGORIES: { id: ReportCategory; label: string; description: string }[] = [
  { id: 'disrespectful', label: 'Culturally Disrespectful / Irrelevant', description: 'Mocking cultural/religious traditions, or irrelevant to this celebration.' },
  { id: 'abuse', label: 'Harassment or Personal Abuse', description: 'Attacking individuals, bullying, or aggressive behavior.' },
  { id: 'hate', label: 'Hate Speech or Discrimination', description: 'Slurs, religious intolerance, communal agitation, or bigotry.' },
  { id: 'spam', label: 'Spam or Commercial Promotion', description: 'Advertising products, paid links, financial scams, or unrelated promos.' },
  { id: 'illegal', label: 'Illegal or Dangerous Content', description: 'Explicit violence, contraband, weapons, or physical threats.' },
  { id: 'other', label: 'Other Harmful Behavior', description: 'Violates general safety principles.' },
];

export function ReportModal({
  isOpen,
  onClose,
  contributionId,
  spaceId,
  contributionCaption,
  authorName,
}: ReportModalProps) {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState<ReportCategory>('disrespectful');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId,
          spaceId,
          reportedByUserId: currentUser.id,
          category,
          details,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setSubmitted(false);
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Report Contribution
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Flagging content for organizer & platform safety triage
              </p>
            </div>
          </div>
          <button
            onClick={handleDone}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-stone-900 dark:text-stone-100">Report Submitted</h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                Thank you for safeguarding this occasion. Space organizers and safety moderators have been notified to triage this contribution.
              </p>
            </div>
            <button
              onClick={handleDone}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 rounded-xl"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 shrink-0" />
                {errorMessage}
              </div>
            )}

            {contributionCaption && (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200/60 dark:border-stone-800 text-xs">
                <span className="text-stone-400 block mb-1">Contribution preview ({authorName || 'Participant'}):</span>
                <p className="italic text-stone-700 dark:text-stone-300 line-clamp-2">&quot;{contributionCaption}&quot;</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                Select Report Category:
              </label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                      category === cat.id
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={category === cat.id}
                      onChange={() => setCategory(cat.id)}
                      className="mt-1 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="text-xs font-semibold block">{cat.label}</span>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">{cat.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                Additional Details (Optional):
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain why this content violates the occasion dignity or safety guidelines..."
                className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-rose-500 focus:outline-hidden min-h-[60px]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" />
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
