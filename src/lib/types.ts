export type OccasionType = 
  | 'festival' 
  | 'wedding' 
  | 'memorial' 
  | 'community' 
  | 'campus' 
  | 'milestone';

export type SpaceVisibility = 'public' | 'location_suggested' | 'invite_only';

export type SpaceStatus = 'upcoming' | 'live' | 'ending_soon' | 'archived' | 'closed';

export type ArchiveVisibility = 'public' | 'limited' | 'private';

export type UserRole = 'user' | 'platform_moderator';

export type ParticipantRole = 'organizer' | 'participant';

export type ContributionType = 'photo' | 'clip' | 'note';

export type ContributionStatus = 'approved' | 'pending_approval' | 'rejected' | 'removed';

export type ReportCategory = 
  | 'abuse' 
  | 'hate' 
  | 'spam' 
  | 'disrespectful' 
  | 'illegal' 
  | 'other';

export type ReportStatus = 'pending' | 'actioned' | 'dismissed';

export interface User {
  id: string;
  displayName: string;
  contactType: 'phone' | 'email';
  contactValue: string;
  isVerified: boolean;
  role: UserRole;
  createdAt: string;
  hasPassword?: boolean;
}

export interface Space {
  id: string;
  name: string;
  slug: string;
  occasionType: OccasionType;
  description: string;
  city: string;
  area: string;
  venue?: string;
  coverImageUrl: string;
  visibility: SpaceVisibility;
  inviteCode?: string;
  startsAt: string;
  endsAt: string;
  statusOverride: 'auto' | 'upcoming' | 'live' | 'archived' | 'closed';
  archiveVisibility: ArchiveVisibility;
  postsRequireApproval: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  // Computed fields
  status?: SpaceStatus;
  participantCount?: number;
  contributionCount?: number;
  creatorName?: string;
}

export interface SpaceParticipant {
  spaceId: string;
  userId: string;
  role: ParticipantRole;
  guidelinesAcknowledgedAt: string | null;
  isBanned: boolean;
  joinedAt: string;
  displayName?: string;
  contactValue?: string;
}

export interface Contribution {
  id: string;
  spaceId: string;
  userId: string;
  type: ContributionType;
  mediaUrl?: string;
  caption: string;
  status: ContributionStatus;
  celebrationCount: number;
  dayBucket: string; // e.g. "Day 1 - Sep 13", "Day 2 - Sep 14"
  createdAt: string;
  authorName?: string;
  hasCelebrated?: boolean;
}

export interface Announcement {
  id: string;
  spaceId: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  authorName?: string;
}

export interface Report {
  id: string;
  contributionId: string;
  spaceId: string;
  reportedByUserId: string;
  category: ReportCategory;
  details: string;
  status: ReportStatus;
  actionTaken?: string;
  reviewedByUserId?: string;
  createdAt: string;
  // Context fields
  contributionCaption?: string;
  contributionMediaUrl?: string;
  contributionType?: ContributionType;
  reporterName?: string;
  spaceName?: string;
  spaceCity?: string;
  authorName?: string;
  authorUserId?: string;
}

export interface ActivityLog {
  id: string;
  spaceId: string;
  actorUserId: string;
  action: string;
  details: string;
  createdAt: string;
  actorName?: string;
}
