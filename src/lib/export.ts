import { getSpaceById, getContributions, getSpaceAnnouncements, getActivityLogs, getUserHistory } from './db';

export function exportUserContributions(userId: string) {
  const history = getUserHistory(userId);
  return {
    exportedAt: new Date().toISOString(),
    userId,
    note: 'Occasion Spaces - Private Personal Contribution Export (Occasion over Person)',
    totalContributions: history.contributions.length,
    spacesParticipatedCount: history.spaces.length,
    contributions: history.contributions,
  };
}

export function exportFullSpaceArchive(spaceId: string) {
  const space = getSpaceById(spaceId);
  if (!space) return null;

  const contributions = getContributions(spaceId, undefined, { status: 'approved' });
  const announcements = getSpaceAnnouncements(spaceId);
  const logs = getActivityLogs(spaceId);

  return {
    exportedAt: new Date().toISOString(),
    occasionSpace: {
      id: space.id,
      name: space.name,
      slug: space.slug,
      occasionType: space.occasionType,
      description: space.description,
      location: {
        city: space.city,
        area: space.area,
        venue: space.venue,
      },
      duration: {
        startsAt: space.startsAt,
        endsAt: space.endsAt,
        finalStatus: space.status,
      },
      coverImageUrl: space.coverImageUrl,
      visibility: space.visibility,
      archiveVisibility: space.archiveVisibility,
      totalContributions: contributions.length,
    },
    announcements,
    contributions,
    activityLedger: logs,
  };
}
