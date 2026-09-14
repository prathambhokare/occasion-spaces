import { Space, SpaceStatus } from './types';

/**
 * Computes the lifecycle status of an occasion space:
 * - upcoming: Starts in the future
 * - live: Currently ongoing (> 12 hours remaining)
 * - ending_soon: Currently ongoing (<= 12 hours remaining before endsAt)
 * - archived: Ended, preserved in read-only mode
 * - closed: Creator has closed or hidden the space
 */
export function getSpaceStatus(space: Pick<Space, 'startsAt' | 'endsAt' | 'statusOverride'>): SpaceStatus {
  if (space.statusOverride && space.statusOverride !== 'auto') {
    return space.statusOverride as SpaceStatus;
  }

  const now = new Date().getTime();
  const start = new Date(space.startsAt).getTime();
  const end = new Date(space.endsAt).getTime();

  if (now < start) {
    return 'upcoming';
  }

  if (now > end) {
    return 'archived';
  }

  const hoursRemaining = (end - now) / (1000 * 60 * 60);
  if (hoursRemaining <= 12 && hoursRemaining > 0) {
    return 'ending_soon';
  }

  return 'live';
}

/**
 * Returns human-friendly time description
 */
export function formatTimeRemaining(endsAt: string): string {
  const now = new Date().getTime();
  const end = new Date(endsAt).getTime();
  const diffMs = end - now;

  if (diffMs <= 0) {
    return 'Occasion ended';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) {
    return `${days} days remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

/**
 * Returns time until occasion begins
 */
export function formatTimeUntilStart(startsAt: string): string {
  const now = new Date().getTime();
  const start = new Date(startsAt).getTime();
  const diffMs = start - now;

  if (diffMs <= 0) {
    return 'Starting now';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 1) {
    return `Starts in ${days} days`;
  }
  if (hours > 0) {
    return `Starts in ${hours} hours`;
  }
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `Starts in ${minutes} minutes`;
}

/**
 * Determines whether participants can add contributions
 */
export function isSpaceOpenForContributions(status: SpaceStatus): boolean {
  return status === 'live' || status === 'ending_soon';
}
