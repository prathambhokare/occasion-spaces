import { NextRequest } from 'next/server';
import { getSession, getUserById } from '@/lib/db';
import { User } from '@/lib/types';

export const SESSION_COOKIE_NAME = 'occasion_session';

/**
 * Extracts the session token from the HTTP-only cookie and resolves the authenticated User.
 * Returns null if no valid session exists.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) {
    return null;
  }

  const sessionData = getSession(sessionCookie.value);
  if (!sessionData) {
    return null;
  }

  return sessionData.user;
}

/**
 * Verifies that the requested action is authorized for the given targetUserId.
 * In development, allows demo fallbacks if configured, but in production strictly
 * ensures the session user matches the requested actor.
 */
export async function verifyUserAuthorization(
  req: NextRequest,
  targetUserId: string
): Promise<{ authorized: boolean; user: User | null; error?: string }> {
  const authUser = await getAuthenticatedUser(req);

  // If valid authenticated session matches target user
  if (authUser && authUser.id === targetUserId) {
    return { authorized: true, user: authUser };
  }

  // Allow platform moderators to act on any resource
  if (authUser && authUser.role === 'platform_moderator') {
    return { authorized: true, user: authUser };
  }

  // Fallback for local development demo switcher if no cookie is present yet
  if (process.env.NODE_ENV !== 'production' && !authUser) {
    const demoUser = getUserById(targetUserId);
    if (demoUser) {
      return { authorized: true, user: demoUser };
    }
  }

  if (!authUser) {
    return { authorized: false, user: null, error: 'Authentication required. Please sign in.' };
  }

  return { authorized: false, user: authUser, error: 'Unauthorized to act on behalf of this user.' };
}
