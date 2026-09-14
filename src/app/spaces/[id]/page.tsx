'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Space, Contribution, Announcement, SpaceParticipant, 
  ActivityLog, ContributionType 
} from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/StatusBadge';
import { GuidelinesModal } from '@/components/GuidelinesModal';
import { ReportModal } from '@/components/ReportModal';
import { triggerCelebrationAnimation } from '@/lib/confetti';
import { formatTimeRemaining, formatTimeUntilStart, isSpaceOpenForContributions } from '@/lib/lifecycle';
import { 
  ArrowLeft, Calendar, MapPin, Users, HeartHandshake, 
  Lock, Share2, Download, ShieldCheck, Megaphone, 
  Sparkles, Filter, Clock, Plus, Trash2, Flag, 
  UserX, CheckCircle, AlertOctagon, X, Settings, 
  Check, Info, UserCheck, Image as ImageIcon, 
  FileText, Video, Eye
} from 'lucide-react';

const PRESET_CONTRIBUTION_IMAGES = [
  { label: 'Aarti Lamps / Diya', url: 'https://images.unsplash.com/photo-1567591414240-e9c1e59f3e06?auto=format&fit=crop&w=800&q=80' },
  { label: 'Festive Florals / Garland', url: 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=800&q=80' },
  { label: 'Celebration Procession', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80' },
  { label: 'Courtyard & Banquet', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80' },
  { label: 'Traditional Sweets & Offerings', url: 'https://images.unsplash.com/photo-1609803388062-8929949f2b86?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ritual Stage & Garba', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80' },
];

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: spaceIdParam } = use(params);
  const { currentUser, allUsers } = useAuth();

  // Space & Feed State
  const [space, setSpace] = useState<Space | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [participant, setParticipant] = useState<SpaceParticipant | null>(null);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Filters & Sorting (FR17, FR19)
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_celebrated'>('newest');

  // Modals & Drawers
  const [guidelinesModalOpen, setGuidelinesModalOpen] = useState(false);
  const [reportModalData, setReportModalData] = useState<{ id: string; caption?: string; author?: string } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [organizerSuiteOpen, setOrganizerSuiteOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Contribution Form State (FR12, FR13, FR16)
  const [contributionType, setContributionType] = useState<ContributionType>('photo');
  const [mediaUrl, setMediaUrl] = useState(PRESET_CONTRIBUTION_IMAGES[0].url);
  const [caption, setCaption] = useState('');
  const [dayBucket, setDayBucket] = useState('Day 1 - Darshan & Arrival');
  const [submittingContribution, setSubmittingContribution] = useState(false);
  const [contributionError, setContributionError] = useState('');
  const [contributionSuccess, setContributionSuccess] = useState('');

  // Organizer Dashboard Data (FR27, FR38)
  const [organizerTab, setOrganizerTab] = useState<'pending' | 'announcements' | 'participants' | 'settings' | 'audit'>('pending');
  const [pendingContributions, setPendingContributions] = useState<Contribution[]>([]);
  const [participantsList, setParticipantsList] = useState<SpaceParticipant[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  
  // Organizer actions
  const [newAnnouncementTitle, setNewAnnouncementTitle] = useState('');
  const [newAnnouncementContent, setNewAnnouncementContent] = useState('');
  const [isPinned, setIsPinned] = useState(true);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false);
  
  // Edit Space Details (FR4, FR5, FR7)
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStatusOverride, setEditStatusOverride] = useState<'auto' | 'upcoming' | 'live' | 'archived' | 'closed'>('auto');
  const [editPostsRequireApproval, setEditPostsRequireApproval] = useState(false);
  const [transferOwnerId, setTransferOwnerId] = useState('');
  const [updatingSettings, setUpdatingSettings] = useState(false);

  // Invite code entry for invite-only
  const [inputInviteCode, setInputInviteCode] = useState('');
  const [inviteCodeError, setInviteCodeError] = useState('');

  // 1. Fetch Space details, contributions, announcements, participant status
  const loadSpaceData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/spaces/${spaceIdParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load occasion space');
      setSpace(data.space);

      // Populate edit fields
      setEditName(data.space.name);
      setEditDescription(data.space.description);
      setEditVenue(data.space.venue || '');
      setEditStatusOverride(data.space.statusOverride || 'auto');
      setEditPostsRequireApproval(Boolean(data.space.postsRequireApproval));

      // Fetch contributions
      const contRes = await fetch(`/api/spaces/${data.space.id}/contributions?userId=${currentUser.id}&sort=${sortBy}`);
      const contData = await contRes.json();
      if (contRes.ok) {
        setContributions(contData.contributions || []);
      }

      // Fetch announcements
      const annRes = await fetch(`/api/spaces/${data.space.id}/announcements`);
      const annData = await annRes.json();
      if (annRes.ok) {
        setAnnouncements(annData.announcements || []);
      }

      // Fetch participant status
      const partRes = await fetch(`/api/spaces/${data.space.id}/join?userId=${currentUser.id}`);
      const partData = await partRes.json();
      if (partRes.ok) {
        setParticipant(partData.participant);
      }

      // Fetch blocked users for current user
      const blockRes = await fetch(`/api/users/block?userId=${currentUser.id}`);
      const blockData = await blockRes.json();
      if (blockRes.ok) {
        setBlockedUserIds(blockData.blockedUserIds || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error loading space');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpaceData();
  }, [spaceIdParam, currentUser.id, sortBy]);

  // Load organizer dashboard data when drawer opens
  const loadOrganizerData = async () => {
    if (!space) return;
    try {
      const res = await fetch(`/api/spaces/${space.id}/moderation?userId=${currentUser.id}`);
      const data = await res.json();
      if (res.ok) {
        setPendingContributions(data.pendingContributions || []);
        setParticipantsList(data.participants || []);
        setActivityLogs(data.activityLogs || []);
      }
    } catch (err) {
      console.error('Failed to load organizer moderation data:', err);
    }
  };

  useEffect(() => {
    if (organizerSuiteOpen && space) {
      loadOrganizerData();
    }
  }, [organizerSuiteOpen]);

  const isOrganizer = space && (space.createdByUserId === currentUser.id || participant?.role === 'organizer');
  const isSpaceActive = space && isSpaceOpenForContributions(space.status || 'live');

  // Handle Join Space (FR8, FR9, FR11)
  const handleJoinSpace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInviteCodeError('');
    if (!space) return;

    try {
      const res = await fetch(`/api/spaces/${space.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          inviteCode: inputInviteCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join occasion');

      setParticipant(data.participant);
      setInputInviteCode('');
      loadSpaceData();
    } catch (err: any) {
      setInviteCodeError(err.message || 'Could not join');
    }
  };

  // Handle Leave Space (FR10)
  const handleLeaveSpace = async () => {
    if (!space) return;
    if (!confirm('Leave this occasion space? You can rejoin at any time.')) return;

    try {
      await fetch(`/api/spaces/${space.id}/join?userId=${currentUser.id}`, { method: 'DELETE' });
      setParticipant(null);
      loadSpaceData();
    } catch (err) {
      console.error('Error leaving space:', err);
    }
  };

  // Handle Celebrate Reaction (FR12, confetti)
  const handleCelebrate = async (e: React.MouseEvent, contributionId: string) => {
    triggerCelebrationAnimation(e);
    if (!space) return;

    try {
      const res = await fetch(`/api/spaces/${space.id}/celebrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributionId,
          userId: currentUser.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setContributions((prev) =>
          prev.map((c) =>
            c.id === contributionId
              ? { ...c, hasCelebrated: data.celebrated, celebrationCount: data.count }
              : c
          )
        );
      }
    } catch (err) {
      console.error('Celebration error:', err);
    }
  };

  // Handle Guidelines Acknowledgment (FR31)
  const handleAcknowledgeGuidelines = async () => {
    if (!space) return;
    try {
      const res = await fetch(`/api/spaces/${space.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          acknowledgeGuidelinesNow: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setParticipant(data.participant);
        setGuidelinesModalOpen(false);
      }
    } catch (err) {
      console.error('Guidelines acknowledge error:', err);
    }
  };

  // Handle Submit Contribution (FR12, FR13, FR16, FR27, FR29, FR30, FR31)
  const handleSubmitContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;

    // Check guidelines acknowledgment first
    if (!participant?.guidelinesAcknowledgedAt) {
      setGuidelinesModalOpen(true);
      return;
    }

    setSubmittingContribution(true);
    setContributionError('');
    setContributionSuccess('');

    try {
      const res = await fetch(`/api/spaces/${space.id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          type: contributionType,
          mediaUrl: contributionType !== 'note' ? mediaUrl : undefined,
          caption,
          dayBucket,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresGuidelines) {
          setGuidelinesModalOpen(true);
          return;
        }
        throw new Error(data.error || 'Failed to submit contribution');
      }

      setContributionSuccess(data.message || 'Added to the celebration!');
      setCaption('');
      setComposerOpen(false);
      loadSpaceData();
    } catch (err: any) {
      setContributionError(err.message || 'Submission error');
    } finally {
      setSubmittingContribution(false);
    }
  };

  // Handle Delete Contribution (FR15, FR27)
  const handleDeleteContribution = async (contributionId: string) => {
    if (!space) return;
    if (!confirm('Remove this contribution from the occasion space?')) return;

    try {
      const res = await fetch(`/api/spaces/${space.id}/contributions?contributionId=${contributionId}&userId=${currentUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setContributions((prev) => prev.filter((c) => c.id !== contributionId));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Handle Block User (FR32)
  const handleToggleBlock = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, targetUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isBlocked) {
          setBlockedUserIds((prev) => [...prev, targetUserId]);
        } else {
          setBlockedUserIds((prev) => prev.filter((id) => id !== targetUserId));
        }
      }
    } catch (err) {
      console.error('Block toggle error:', err);
    }
  };

  // Organizer: Post Announcement (FR39)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space || !newAnnouncementTitle || !newAnnouncementContent) return;

    setSubmittingAnnouncement(true);
    try {
      const res = await fetch(`/api/spaces/${space.id}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: newAnnouncementTitle,
          content: newAnnouncementContent,
          isPinned,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAnnouncements((prev) => [data.announcement, ...prev]);
        setNewAnnouncementTitle('');
        setNewAnnouncementContent('');
        loadOrganizerData();
      }
    } catch (err) {
      console.error('Announcement post error:', err);
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  // Organizer: Moderation actions (approve/reject pending, ban user) (FR27)
  const handleModerateContribution = async (action: 'approve_contribution' | 'reject_contribution' | 'remove_contribution', targetContributionId: string) => {
    if (!space) return;
    try {
      const res = await fetch(`/api/spaces/${space.id}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: currentUser.id,
          action,
          targetContributionId,
        }),
      });
      if (res.ok) {
        setPendingContributions((prev) => prev.filter((c) => c.id !== targetContributionId));
        loadSpaceData();
        loadOrganizerData();
      }
    } catch (err) {
      console.error('Moderation action error:', err);
    }
  };

  const handleSetUserBan = async (targetUserId: string, ban: boolean) => {
    if (!space) return;
    try {
      const res = await fetch(`/api/spaces/${space.id}/moderation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: currentUser.id,
          action: 'set_user_ban',
          targetUserId,
          isBanned: ban,
        }),
      });
      if (res.ok) {
        setParticipantsList((prev) =>
          prev.map((p) => (p.userId === targetUserId ? { ...p, isBanned: ban } : p))
        );
        loadOrganizerData();
      }
    } catch (err) {
      console.error('Ban toggle error:', err);
    }
  };

  // Organizer: Update Space Settings & Transfer Ownership (FR4, FR5, FR7, FR27)
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!space) return;
    setUpdatingSettings(true);

    try {
      const updates: any = {
        name: editName,
        description: editDescription,
        venue: editVenue,
        statusOverride: editStatusOverride,
        postsRequireApproval: editPostsRequireApproval,
      };

      if (transferOwnerId && transferOwnerId !== space.createdByUserId) {
        updates.createdByUserId = transferOwnerId;
      }

      const res = await fetch(`/api/spaces/${space.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorUserId: currentUser.id,
          updates,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSpace(data.space);
        setOrganizerSuiteOpen(false);
        loadSpaceData();
      }
    } catch (err) {
      console.error('Update settings error:', err);
    } finally {
      setUpdatingSettings(false);
    }
  };

  // Download Space Archive (FR37)
  const handleExportArchive = () => {
    if (!space) return;
    window.location.href = `/api/export?type=space&id=${space.id}`;
  };

  // Copy shareable link
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6 animate-pulse">
        <div className="h-64 bg-stone-200 dark:bg-stone-800 rounded-3xl" />
        <div className="h-10 bg-stone-200 dark:bg-stone-800 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
          <div className="h-48 bg-stone-200 dark:bg-stone-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (errorMessage || !space) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
          Occasion Space Not Found
        </h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          {errorMessage || 'This occasion space does not exist or may have been removed.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-stone-800 text-white font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Discover Occasions
        </Link>
      </div>
    );
  }

  // Filter contributions by type, day, and exclude blocked users (FR18, FR19, FR32)
  const visibleContributions = contributions.filter((c) => {
    if (blockedUserIds.includes(c.userId)) return false;
    if (selectedType !== 'all' && c.type !== selectedType) return false;
    if (selectedDay !== 'all' && c.dayBucket !== selectedDay) return false;
    return true;
  });

  // Extract unique day buckets from contributions for the filter tabs
  const availableDayBuckets = Array.from(new Set(contributions.map((c) => c.dayBucket))).filter(Boolean);

  const status = space.status || 'live';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Explore Occasions
        </Link>

        <div className="flex items-center gap-2">
          {/* Share Link */}
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Occasion'}</span>
          </button>

          {/* Export Space Archive (FR37) */}
          <button
            onClick={handleExportArchive}
            className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-1.5 transition-colors"
            title="Download full occasion memento (metadata, announcements, and memories in JSON)"
          >
            <Download className="w-3.5 h-3.5 text-amber-600" />
            <span>Export Archive</span>
          </button>

          {/* Organizer Dashboard Trigger (FR27, FR38) */}
          {isOrganizer && (
            <button
              onClick={() => setOrganizerSuiteOpen(true)}
              className="px-3 py-1.5 text-xs rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Organizer Suite</span>
              {pendingContributions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingContributions.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Hero Occasion Banner (FR1, FR3, FR6) */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900 shadow-md">
        
        {/* Cover Photo */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={space.coverImageUrl}
            alt={space.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
        </div>

        {/* Top Floating Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-stone-900/80 backdrop-blur-xs text-stone-200 border border-stone-700 uppercase tracking-wider">
              {space.occasionType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {space.visibility === 'invite_only' && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 backdrop-blur-xs text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Invite-Only ({space.inviteCode})
              </span>
            )}
            {space.postsRequireApproval && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 backdrop-blur-xs text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Moderated Feed
              </span>
            )}
          </div>
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-white space-y-3">
          
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {space.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-stone-300">
              <span className="flex items-center gap-1 text-amber-300 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                {space.area}, {space.city} {space.venue ? `• ${space.venue}` : ''}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(space.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(space.endsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {space.participantCount || 0} participants
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-stone-200 max-w-3xl leading-relaxed">
            {space.description}
          </p>

          {/* Action Row & Lifecycle Sunset Notification (FR3, FR5, FR8, FR10) */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-stone-700/60">
            
            <div className="flex items-center gap-2 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {status === 'upcoming' && (
                <span className="text-amber-200">{formatTimeUntilStart(space.startsAt)}</span>
              )}
              {(status === 'live' || status === 'ending_soon') && (
                <span className="text-amber-200 font-semibold">{formatTimeRemaining(space.endsAt)} (Auto-sunsets after celebration)</span>
              )}
              {status === 'archived' && (
                <span className="text-stone-300">Celebration concluded. Preserved as read-only occasion memory.</span>
              )}
              {status === 'closed' && (
                <span className="text-stone-400">This space is currently closed by organizers.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {participant ? (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Joined as {participant.role === 'organizer' ? 'Organizer' : 'Participant'}
                  </span>
                  {participant.role !== 'organizer' && (
                    <button
                      onClick={handleLeaveSpace}
                      className="text-xs text-stone-400 hover:text-rose-400 underline transition-colors"
                    >
                      Leave Space
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleJoinSpace()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Join This Occasion Space
                </button>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Pinned Announcements Board (FR39) */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-500" />
              Organizer Bulletins & Announcements
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 font-semibold">
                  <span className="flex items-center gap-1.5 font-bold">
                    📌 {ann.title}
                  </span>
                  <span className="text-[10px] text-amber-700/80 dark:text-amber-400">
                    {new Date(ann.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs">
                  {ann.content}
                </p>
                <div className="text-[10px] text-stone-500 dark:text-stone-400">
                  Posted by {ann.authorName || 'Space Organizer'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Contribution Action & Filter Bar (FR12, FR13, FR17, FR19) */}
      <div className="space-y-4 pt-2">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
          
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-rose-500" />
              Occasion Memories & Blessings
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Shared exclusively within this celebration ({visibleContributions.length} memories)
            </p>
          </div>

          {/* Add to the celebration Button (FR12, FR13) */}
          <div>
            {isSpaceActive ? (
              <button
                onClick={() => {
                  if (!participant?.guidelinesAcknowledgedAt) {
                    setGuidelinesModalOpen(true);
                  } else {
                    setComposerOpen(true);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                Add to the Celebration
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 text-xs flex items-center gap-1.5 border border-stone-200 dark:border-stone-700">
                <Lock className="w-3.5 h-3.5" />
                <span>Contributions closed ({status})</span>
              </div>
            )}
          </div>

        </div>

        {/* Filter Controls (Day Buckets, Types, Sort) (FR17, FR19) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Day Buckets Pill Selector (FR17) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-stone-400 font-medium shrink-0 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Day:
            </span>
            <button
              onClick={() => setSelectedDay('all')}
              className={`px-3 py-1 rounded-full border transition-all shrink-0 ${
                selectedDay === 'all'
                  ? 'bg-amber-500 text-stone-950 font-bold border-amber-500'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
              }`}
            >
              All Days
            </button>
            {availableDayBuckets.map((bucket) => (
              <button
                key={bucket}
                onClick={() => setSelectedDay(bucket)}
                className={`px-3 py-1 rounded-full border transition-all shrink-0 ${
                  selectedDay === bucket
                    ? 'bg-amber-500 text-stone-950 font-bold border-amber-500'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-300'
                }`}
              >
                {bucket}
              </button>
            ))}
          </div>

          {/* Media Type & Sort Selector (FR19) */}
          <div className="flex items-center gap-2">
            
            {/* Type selector */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-850 p-1 rounded-xl border border-stone-200 dark:border-stone-800">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  selectedType === 'all' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedType('photo')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  selectedType === 'photo' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <ImageIcon className="w-3 h-3" /> Photos
              </button>
              <button
                onClick={() => setSelectedType('note')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                  selectedType === 'note' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <FileText className="w-3 h-3" /> Notes
              </button>
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs p-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-hidden"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_celebrated">Most Celebrated ✨</option>
            </select>

          </div>

        </div>

      </div>

      {/* Contributions Grid / Feed (FR14, FR18, FR20) */}
      {visibleContributions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleContributions.map((item) => {
            const isMyContribution = item.userId === currentUser.id;
            const canDelete = isMyContribution || isOrganizer;

            return (
              <div
                key={item.id}
                className="group flex flex-col bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/90 dark:border-stone-800 overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                {/* Photo / Media Preview */}
                {item.mediaUrl && (
                  <div className="relative h-60 w-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <img
                      src={item.mediaUrl}
                      alt={item.caption}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-900/70 backdrop-blur-xs text-white uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  
                  <div className="space-y-2">
                    {/* Note styled presentation if no media */}
                    {!item.mediaUrl && (
                      <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                        <p className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed italic">
                          &quot;{item.caption}&quot;
                        </p>
                      </div>
                    )}

                    {item.mediaUrl && (
                      <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-3">
                        {item.caption}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                      <span className="font-semibold text-stone-600 dark:text-stone-400">
                        {item.authorName || 'Devotee / Guest'}
                      </span>
                      <span>{item.dayBucket}</span>
                    </div>
                  </div>

                  {/* Card Actions Footer (FR12 celebration, FR15 delete, FR26 report, FR32 block) */}
                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs">
                    
                    {/* Celebration Button (confetti burst) */}
                    <button
                      onClick={(e) => handleCelebrate(e, item.id)}
                      className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 ${
                        item.hasCelebrated
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-800'
                          : 'bg-stone-50 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:text-rose-500 hover:bg-rose-50/50'
                      }`}
                      title="Celebrate this memory"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${item.hasCelebrated ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{item.celebrationCount || 0}</span>
                    </button>

                    {/* Report, Block & Delete */}
                    <div className="flex items-center gap-2">
                      
                      {/* Report button (FR26) */}
                      {!isMyContribution && (
                        <button
                          onClick={() =>
                            setReportModalData({
                              id: item.id,
                              caption: item.caption,
                              author: item.authorName,
                            })
                          }
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Report content"
                        >
                          <Flag className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Block author button (FR32) */}
                      {!isMyContribution && (
                        <button
                          onClick={() => handleToggleBlock(item.userId)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Block this author in my feed"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete button (FR15, FR27) */}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteContribution(item.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Remove contribution"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            No memories matched your filter
          </h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Be the first to share a blessing, photo, or note for &quot;{space.name}&quot;.
          </p>
          {isSpaceActive && (
            <div className="pt-2">
              <button
                onClick={() => {
                  if (!participant?.guidelinesAcknowledgedAt) {
                    setGuidelinesModalOpen(true);
                  } else {
                    setComposerOpen(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs"
              >
                + Add to the Celebration
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contribution Composer Modal (FR12, FR13, FR16, FR27, FR29, FR30) */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Add to the Celebration
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">
                    Contributing to {space.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setComposerOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitContribution} className="p-6 space-y-4">
              
              {contributionError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 shrink-0" />
                  {contributionError}
                </div>
              )}

              {space.postsRequireApproval && (
                <div className="p-3 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-xl border border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Approval Mode Enabled: Your memory will be reviewed by organizers before appearing publicly.</span>
                </div>
              )}

              {/* Type Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Contribution Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setContributionType('photo')}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 font-medium transition-all ${
                      contributionType === 'photo'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributionType('note')}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 font-medium transition-all ${
                      contributionType === 'note'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Note / Wish
                  </button>
                  <button
                    type="button"
                    onClick={() => setContributionType('clip')}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 font-medium transition-all ${
                      contributionType === 'clip'
                        ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 font-bold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Video Clip
                  </button>
                </div>
              </div>

              {/* Media Selection (For Photo / Clip) */}
              {contributionType !== 'note' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                    Select Curated Occasion Photo or Paste URL
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_CONTRIBUTION_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setMediaUrl(preset.url)}
                        className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          mediaUrl === preset.url ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        <span className="absolute inset-0 bg-stone-900/50 p-1 text-[9px] text-white flex items-end">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="Or paste an image URL..."
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              )}

              {/* Day Bucket selection (FR17) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block">
                  Occasion Day / Timeline Bucket
                </label>
                <input
                  type="text"
                  required
                  value={dayBucket}
                  onChange={(e) => setDayBucket(e.target.value)}
                  placeholder="e.g., Day 1 - Sangeet, Day 2 - Main Darshan"
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Caption or Note text */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-stone-700 dark:text-stone-300">
                    {contributionType === 'note' ? 'Your Blessing / Reflection / Prayer *' : 'Caption / Memory Context *'}
                  </label>
                  <span className="text-[10px] text-stone-400">{caption.length}/500</span>
                </div>
                <textarea
                  required
                  maxLength={500}
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={
                    contributionType === 'note'
                      ? 'Write your heartfelt blessings, prayers, or memory for this gathering...'
                      : 'Add respectful cultural context or blessings...'
                  }
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Contributor Identity notice (FR9, FR22) */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-[11px] text-stone-500 flex items-center justify-between">
                <span>Contributing as: <strong>{currentUser.displayName}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Verified {currentUser.contactType}</span>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingContribution}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {submittingContribution ? 'Adding to celebration...' : 'Add to Celebration'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Organizer Suite Drawer / Modal (FR4, FR5, FR7, FR27, FR38, FR39) */}
      {organizerSuiteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Organizer Governance Suite
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Managing {space.name} (FR27, FR38, FR39)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrganizerSuiteOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center gap-1 p-2 bg-stone-100 dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 overflow-x-auto">
              <button
                onClick={() => setOrganizerTab('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  organizerTab === 'pending' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <span>Pending Approval Queue</span>
                {pendingContributions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {pendingContributions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setOrganizerTab('announcements')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  organizerTab === 'announcements' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" /> Pinned Bulletins
              </button>
              <button
                onClick={() => setOrganizerTab('participants')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  organizerTab === 'participants' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Participants ({participantsList.length})
              </button>
              <button
                onClick={() => setOrganizerTab('settings')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  organizerTab === 'settings' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> Space Settings
              </button>
              <button
                onClick={() => setOrganizerTab('audit')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  organizerTab === 'audit' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs' : 'text-stone-500'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Activity Ledger
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Tab 1: Pending Contributions Approval Queue (FR27) */}
              {organizerTab === 'pending' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Pending Content Approvals
                      </h4>
                      <p className="text-xs text-stone-500">
                        When &quot;Contributions Require Approval&quot; is enabled, participants&apos; photos and notes wait here before appearing in the public feed.
                      </p>
                    </div>
                  </div>

                  {pendingContributions.length > 0 ? (
                    <div className="space-y-3">
                      {pendingContributions.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            {item.mediaUrl && (
                              <img
                                src={item.mediaUrl}
                                alt="Pending"
                                className="w-16 h-16 rounded-xl object-cover shrink-0"
                              />
                            )}
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                                  {item.authorName || 'Guest'}
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  {item.dayBucket} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 dark:text-stone-300 italic">
                                &quot;{item.caption}&quot;
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              onClick={() => handleModerateContribution('reject_contribution', item.id)}
                              className="px-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleModerateContribution('approve_contribution', item.id)}
                              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-xs text-stone-500">
                      No contributions currently waiting for organizer review. All approved items are live in the feed!
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Post Pinned Announcement (FR39) */}
              {organizerTab === 'announcements' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Post Space Announcement / Bulletin
                    </h4>
                    <p className="text-xs text-stone-500">
                      Pin important schedule changes, darshan updates, or ceremony directions for all attendees.
                    </p>
                  </div>

                  <form onSubmit={handlePostAnnouncement} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        Bulletin Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAnnouncementTitle}
                        onChange={(e) => setNewAnnouncementTitle(e.target.value)}
                        placeholder="e.g., Visarjan Aarti Schedule & Meeting Gate"
                        className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        Bulletin Content *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newAnnouncementContent}
                        onChange={(e) => setNewAnnouncementContent(e.target.value)}
                        placeholder="Explain directions, timings, or sacred rituals for attendees..."
                        className="w-full text-xs p-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="rounded-xs text-amber-600"
                        />
                        <span>Pin to top of occasion space</span>
                      </label>

                      <button
                        type="submit"
                        disabled={submittingAnnouncement}
                        className="px-5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        {submittingAnnouncement ? 'Publishing...' : 'Publish Bulletin'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: Participant Management & Bans (FR27) */}
              {organizerTab === 'participants' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Space Participants & Access Control
                    </h4>
                    <p className="text-xs text-stone-500">
                      View participants and restrict bad actors from contributing to this occasion.
                    </p>
                  </div>

                  <div className="divide-y divide-stone-100 dark:divide-stone-800 border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
                    {participantsList.map((p) => {
                      const isSelf = p.userId === currentUser.id;
                      return (
                        <div key={p.userId} className="p-3.5 flex items-center justify-between text-xs bg-white dark:bg-stone-900">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-stone-900 dark:text-stone-100">
                                {p.displayName || p.userId}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                                {p.role}
                              </span>
                              {p.isBanned && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  Restricted / Banned
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-stone-400">
                              Joined {new Date(p.joinedAt).toLocaleDateString()}
                            </span>
                          </div>

                          {!isSelf && p.role !== 'organizer' && (
                            <button
                              onClick={() => handleSetUserBan(p.userId, !p.isBanned)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                                p.isBanned
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              {p.isBanned ? 'Lift Restriction' : 'Ban from Space'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 4: Space Settings, Lifecycle & Ownership Transfer (FR4, FR5, FR7, FR27) */}
              {organizerTab === 'settings' && (
                <form onSubmit={handleUpdateSettings} className="space-y-5 text-xs">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Occasion Space Settings & Ownership
                    </h4>
                    <p className="text-xs text-stone-500">
                      Update metadata, toggle approval mode, or transfer ownership to a co-organizer.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        Occasion Name
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        Description & Cultural Context
                      </label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        Venue / Sub-location
                      </label>
                      <input
                        type="text"
                        value={editVenue}
                        onChange={(e) => setEditVenue(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent"
                      />
                    </div>

                    {/* Approval Mode Toggle (FR27) */}
                    <label className="flex items-start gap-3 p-3 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editPostsRequireApproval}
                        onChange={(e) => setEditPostsRequireApproval(e.target.checked)}
                        className="mt-0.5 rounded-xs text-amber-600"
                      />
                      <div>
                        <span className="font-semibold block text-stone-900 dark:text-stone-100">
                          Enable &quot;Contributions Require Approval&quot; Mode
                        </span>
                        <span className="text-[11px] text-stone-500 block">
                          Organizers review memories before they appear publicly.
                        </span>
                      </div>
                    </label>

                    {/* Manual Lifecycle Override (FR5) */}
                    <div>
                      <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                        Manual Lifecycle Status (FR5)
                      </label>
                      <select
                        value={editStatusOverride}
                        onChange={(e) => setEditStatusOverride(e.target.value as any)}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-transparent"
                      >
                        <option value="auto">Auto (Calculate based on start & end dates)</option>
                        <option value="live">Force Live</option>
                        <option value="archived">Archive Now (Make read-only)</option>
                        <option value="closed">Close Space</option>
                      </select>
                    </div>

                    {/* Ownership Transfer (FR7) */}
                    <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
                      <label className="font-semibold text-amber-900 dark:text-amber-200 block">
                        Transfer Space Ownership (FR7)
                      </label>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300">
                        Pass primary organizer responsibility to another verified community member.
                      </p>
                      <select
                        value={transferOwnerId}
                        onChange={(e) => setTransferOwnerId(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-900"
                      >
                        <option value="">Keep current owner ({space.creatorName || currentUser.displayName})</option>
                        {allUsers
                          .filter((u) => u.id !== space.createdByUserId)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.displayName} ({u.contactValue})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={updatingSettings}
                      className="px-6 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                    >
                      {updatingSettings ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 5: Activity & Moderation Audit Ledger (FR27, FR38) */}
              {organizerTab === 'audit' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Space Activity & Moderation Audit Ledger
                    </h4>
                    <p className="text-xs text-stone-500">
                      Chronological ledger of organizer governance, content removals, and space events.
                    </p>
                  </div>

                  {activityLogs.length > 0 ? (
                    <div className="space-y-2 font-mono text-[11px]">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex items-start justify-between gap-2"
                        >
                          <div className="space-y-0.5">
                            <span className="font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                              [{log.action}]
                            </span>
                            <p className="text-stone-700 dark:text-stone-300 font-sans text-xs">
                              {log.details}
                            </p>
                            <span className="text-[10px] text-stone-400 font-sans">
                              By {log.actorName || log.actorUserId}
                            </span>
                          </div>
                          <span className="text-stone-400 shrink-0">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-stone-400">
                      No activity logged yet.
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Guidelines Modal (FR31) */}
      <GuidelinesModal
        isOpen={guidelinesModalOpen}
        onClose={() => setGuidelinesModalOpen(false)}
        onAcknowledge={handleAcknowledgeGuidelines}
        occasionName={space.name}
        occasionType={space.occasionType}
      />

      {/* Report Modal (FR26) */}
      {reportModalData && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportModalData(null)}
          contributionId={reportModalData.id}
          spaceId={space.id}
          contributionCaption={reportModalData.caption}
          authorName={reportModalData.author}
        />
      )}

    </div>
  );
}

