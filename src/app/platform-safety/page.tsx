'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Report } from '@/lib/types';
import { 
  Shield, AlertTriangle, CheckCircle2, XCircle, 
  Flag, Eye, Filter, UserCheck, ArrowLeft, 
  MapPin, Clock, Info, ShieldAlert, Sparkles 
} from 'lucide-react';

export default function PlatformSafetyPage() {
  const { currentUser, switchUserById, allUsers } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'actioned' | 'dismissed'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Action modal / confirmation
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<'takedown_content' | 'dismiss' | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [actioning, setActioning] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isModerator = currentUser.role === 'platform_moderator';

  const loadReports = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'all' ? '/api/reports' : `/api/reports?status=${statusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load safety reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [statusFilter]);

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !actionType) return;

    setActioning(true);
    setErrorMessage('');
    setFeedbackMessage('');

    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          reviewerUserId: currentUser.id,
          action: actionType,
          notes: moderatorNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply moderation action');
      }

      setFeedbackMessage(data.message || 'Action completed successfully');
      setSelectedReport(null);
      setActionType(null);
      setModeratorNotes('');
      loadReports();
    } catch (err: any) {
      setErrorMessage(err.message || 'Action failed');
    } finally {
      setActioning(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      
      {/* Breadcrumb & Title */}
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
              <Shield className="w-7 h-7 text-rose-500" />
              Platform Safety & Moderation Hub
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Cross-space safety queue to protect the sanctity and dignity of cultural occasions (FR26, FR28).
            </p>
          </div>

          {/* Current persona indicator */}
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
            <span className="text-stone-400">Moderator:</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200">
              {currentUser.displayName}
            </span>
            {isModerator ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                Safety Team
              </span>
            ) : (
              <button
                onClick={() => switchUserById('user-anita')}
                className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] hover:underline"
              >
                Switch to Anita (Safety Lead)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Notice Banner if not moderator */}
      {!isModerator && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              You are currently viewing as a regular participant (<strong>{currentUser.displayName}</strong>). To take triage actions (takedowns, dismissals), switch to a platform safety moderator.
            </span>
          </div>
          <button
            onClick={() => switchUserById('user-anita')}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0"
          >
            Switch to Anita Roy (Safety Lead)
          </button>
        </div>
      )}

      {feedbackMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Triage Dashboard Section */}
      <div className="space-y-4">
        
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-850 rounded-2xl border border-stone-200 dark:border-stone-800">
            {(['pending', 'actioned', 'dismissed', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="disrespectful">Culturally Disrespectful</option>
              <option value="abuse">Harassment / Abuse</option>
              <option value="hate">Hate Speech</option>
              <option value="spam">Spam / Promotion</option>
              <option value="illegal">Illegal Content</option>
              <option value="other">Other</option>
            </select>
          </div>

        </div>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
            ))}
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const isPending = report.status === 'pending';
              const isActioned = report.status === 'actioned';
              const isDismissed = report.status === 'dismissed';

              return (
                <div
                  key={report.id}
                  className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-4"
                >
                  {/* Top Bar: Space & Category */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800/80 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {report.category}
                      </span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {report.spaceName || 'Occasion Space'}
                      </span>
                      {report.spaceCity && (
                        <span className="text-stone-400 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-amber-600" />
                          {report.spaceCity}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-stone-400 text-[11px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(report.createdAt).toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                        isActioned ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}>
                        {report.status}
                      </span>
                    </div>
                  </div>

                  {/* Body: Flagged Content Preview vs Reporter Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    
                    {/* Reported Content Preview */}
                    <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-800 space-y-2">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block">
                        Reported Contribution Content ({report.contributionType || 'note'})
                      </span>
                      
                      {report.contributionMediaUrl && (
                        <img
                          src={report.contributionMediaUrl}
                          alt="Reported content"
                          className="w-full h-36 object-cover rounded-xl"
                        />
                      )}

                      <p className="italic text-stone-800 dark:text-stone-200 leading-relaxed font-serif text-xs">
                        &quot;{report.contributionCaption || 'No caption provided'}&quot;
                      </p>

                      <div className="text-[10px] text-stone-400 pt-1">
                        Author: <strong>{report.authorName || report.authorUserId || 'Participant'}</strong>
                      </div>
                    </div>

                    {/* Reporter Reason & Details */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 space-y-2 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide block">
                          Reason Flagged by Attendee
                        </span>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {report.details}
                        </p>
                        <div className="text-[10px] text-stone-400">
                          Reported by: {report.reporterName || report.reportedByUserId}
                        </div>
                      </div>

                      {/* Prior action summary if already reviewed */}
                      {report.actionTaken && (
                        <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400">
                          <strong>Moderator Resolution:</strong> {report.actionTaken}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Actions Bar */}
                  {isPending && isModerator && (
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-3 text-xs">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('dismiss');
                        }}
                        className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setActionType('takedown_content');
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Takedown Content
                      </button>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              No reports in this queue
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              All community reports matching status &quot;{statusFilter}&quot; have been resolved.
            </p>
          </div>
        )}

      </div>

      {/* Safety Principles & Standards Reference (NFR25, NFR26, NFR27) */}
      <div className="p-6 rounded-3xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          Occasion Spaces Cultural Dignity & Safety Standards
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1">
            <h4 className="font-bold text-stone-800 dark:text-stone-200">1. Sacred & Cultural Preservation</h4>
            <p className="text-stone-500 leading-relaxed text-[11px]">
              Content must respect the solemnity or celebration of religious rituals, memorials, and weddings. Zero tolerance for communal hate or mocking sacred symbols.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1">
            <h4 className="font-bold text-stone-800 dark:text-stone-200">2. No Commercial Spam</h4>
            <p className="text-stone-500 leading-relaxed text-[11px]">
              Occasion spaces are dedicated to real-world participants. Promotional links, ticket scalping, merchandise sales, and referral codes are immediately removed.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-1">
            <h4 className="font-bold text-stone-800 dark:text-stone-200">3. Rapid Takedowns & Bans</h4>
            <p className="text-stone-500 leading-relaxed text-[11px]">
              Space organizers and platform safety leads have direct levers to ban bad actors and take down infringing content with immediate propagation across the feed.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedReport && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                actionType === 'takedown_content' ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-600'
              }`}>
                {actionType === 'takedown_content' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  {actionType === 'takedown_content' ? 'Confirm Content Takedown' : 'Dismiss Safety Report'}
                </h3>
                <p className="text-xs text-stone-500">
                  {actionType === 'takedown_content'
                    ? 'This will immediately remove the content from the occasion space feed.'
                    : 'Marks report reviewed as conforming to community standards.'}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleExecuteAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  Moderator Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={moderatorNotes}
                  onChange={(e) => setModeratorNotes(e.target.value)}
                  placeholder="Reasoning for audit trail..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setActionType(null);
                  }}
                  className="px-4 py-2 text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actioning}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all ${
                    actionType === 'takedown_content'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-stone-800 hover:bg-stone-900'
                  }`}
                >
                  {actioning ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

