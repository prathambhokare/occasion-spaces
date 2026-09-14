import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { 
  User, Space, SpaceParticipant, Contribution, 
  Announcement, Report, ActivityLog, SpaceStatus, ContributionStatus 
} from './types';
import { getSpaceStatus } from './lifecycle';

const dbPath = path.resolve(process.cwd(), 'occasion_spaces.db');
const db = new Database(dbPath, { timeout: 15000 });

// Enable foreign keys, busy timeout, and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 15000');
db.pragma('foreign_keys = ON');

// Initialize Schema
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      contact_type TEXT NOT NULL CHECK(contact_type IN ('phone', 'email')),
      contact_value TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'platform_moderator')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      occasion_type TEXT NOT NULL,
      description TEXT NOT NULL,
      city TEXT NOT NULL,
      area TEXT NOT NULL,
      venue TEXT,
      cover_image_url TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'location_suggested', 'invite_only')),
      invite_code TEXT,
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      status_override TEXT NOT NULL DEFAULT 'auto',
      archive_visibility TEXT NOT NULL DEFAULT 'public' CHECK(archive_visibility IN ('public', 'limited', 'private')),
      posts_require_approval INTEGER NOT NULL DEFAULT 0,
      created_by_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(created_by_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS space_participants (
      space_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'participant' CHECK(role IN ('organizer', 'participant')),
      guidelines_acknowledged_at TEXT,
      is_banned INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (space_id, user_id),
      FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('photo', 'clip', 'note')),
      media_url TEXT,
      caption TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('approved', 'pending_approval', 'rejected', 'removed')),
      celebration_count INTEGER NOT NULL DEFAULT 0,
      day_bucket TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS celebrations (
      contribution_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (contribution_id, user_id),
      FOREIGN KEY(contribution_id) REFERENCES contributions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS space_announcements (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_pinned INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      contribution_id TEXT NOT NULL,
      space_id TEXT NOT NULL,
      reported_by_user_id TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('abuse', 'hate', 'spam', 'disrespectful', 'illegal', 'other')),
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'actioned', 'dismissed')),
      action_taken TEXT,
      reviewed_by_user_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(contribution_id) REFERENCES contributions(id) ON DELETE CASCADE,
      FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY(reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blocked_users (
      user_id TEXT NOT NULL,
      blocked_user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, blocked_user_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS space_activity_logs (
      id TEXT PRIMARY KEY,
      space_id TEXT NOT NULL,
      actor_user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
      FOREIGN KEY(actor_user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  try {
    const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    if (userCount && userCount.count > 0) return;

  const now = new Date();
  const past2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const todayPlus6h = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();
  const todayPlus2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const todayPlus5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const past2DaysEnd = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, display_name, contact_type, contact_value, is_verified, role, created_at)
    VALUES (@id, @displayName, @contactType, @contactValue, @isVerified, @role, @createdAt)
  `);

  const demoUsers = [
    {
      id: 'user-priya',
      displayName: 'Priya Sharma (Convener)',
      contactType: 'phone',
      contactValue: '+91 98201 23456',
      isVerified: 1,
      role: 'user',
      createdAt: past7Days,
    },
    {
      id: 'user-rahul',
      displayName: 'Rahul Verma',
      contactType: 'email',
      contactValue: 'rahul.verma@example.com',
      isVerified: 1,
      role: 'user',
      createdAt: past7Days,
    },
    {
      id: 'user-anita',
      displayName: 'Anita Roy (Safety Lead)',
      contactType: 'email',
      contactValue: 'safety.lead@occasionspaces.org',
      isVerified: 1,
      role: 'platform_moderator',
      createdAt: past7Days,
    },
    {
      id: 'user-samira',
      displayName: 'Samira Khan',
      contactType: 'phone',
      contactValue: '+91 98111 78901',
      isVerified: 1,
      role: 'user',
      createdAt: past7Days,
    },
  ];

  for (const u of demoUsers) {
    insertUser.run(u);
  }

  // 2. Seed Spaces
  const insertSpace = db.prepare(`
    INSERT INTO spaces (
      id, name, slug, occasion_type, description, city, area, venue, 
      cover_image_url, visibility, invite_code, starts_at, ends_at, 
      status_override, archive_visibility, posts_require_approval, created_by_user_id, created_at, updated_at
    ) VALUES (
      @id, @name, @slug, @occasionType, @description, @city, @area, @venue, 
      @coverImageUrl, @visibility, @inviteCode, @startsAt, @endsAt, 
      @statusOverride, @archiveVisibility, @postsRequireApproval, @createdByUserId, @createdAt, @updatedAt
    )
  `);

  const demoSpaces = [
    {
      id: 'space-lalbaug',
      name: 'Lalbaugcha Raja Ganeshotsav 2026',
      slug: 'lalbaugcha-raja-2026',
      occasionType: 'festival',
      description: 'The sacred 10-day celebration in Mumbai. Share devotion, darshan moments, and heartfelt blessings. Please maintain absolute cultural dignity.',
      city: 'Mumbai',
      area: 'Lalbaug, Parel',
      venue: 'Shree Ganesh Nagar Central Pandal',
      coverImageUrl: 'https://images.unsplash.com/photo-1567591414240-e9c1e59f3e06?auto=format&fit=crop&w=1200&q=80',
      visibility: 'public',
      inviteCode: null,
      startsAt: past2Days,
      endsAt: todayPlus6h, // ending soon within 6 hours!
      statusOverride: 'auto',
      archiveVisibility: 'public',
      postsRequireApproval: 0,
      createdByUserId: 'user-priya',
      createdAt: past7Days,
      updatedAt: past7Days,
    },
    {
      id: 'space-wedding',
      name: "Arjun & Sneha's Sangeet & Vivah",
      slug: 'arjun-sneha-wedding-2026',
      occasionType: 'wedding',
      description: 'A close gathering of family and friends celebrating our union in the pink city of Jaipur. Moderated space: contributions need approval before appearing.',
      city: 'Jaipur',
      area: 'Bhawani Singh Road',
      venue: 'Rambagh Palace Courtyard',
      coverImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      visibility: 'invite_only',
      inviteCode: 'JAIPUR2026',
      startsAt: past2Days,
      endsAt: todayPlus2Days,
      statusOverride: 'auto',
      archiveVisibility: 'limited',
      postsRequireApproval: 1, // approval mode demo!
      createdByUserId: 'user-priya',
      createdAt: past7Days,
      updatedAt: past7Days,
    },
    {
      id: 'space-durga',
      name: 'Ballygunge Cultural Durga Puja 2026',
      slug: 'ballygunge-durga-puja-2026',
      occasionType: 'festival',
      description: 'Welcoming Maa Durga with traditional Dhak beats, exquisite Pratima artistry, and community Bhog. Opening soon for Maha Saptami.',
      city: 'Kolkata',
      area: 'Ballygunge',
      venue: 'Cultural Association Grounds',
      coverImageUrl: 'https://images.unsplash.com/photo-1601662528567-526cd06f6582?auto=format&fit=crop&w=1200&q=80',
      visibility: 'public',
      inviteCode: null,
      startsAt: todayPlus2Days,
      endsAt: todayPlus5Days,
      statusOverride: 'auto',
      archiveVisibility: 'public',
      postsRequireApproval: 0,
      createdByUserId: 'user-rahul',
      createdAt: past7Days,
      updatedAt: past7Days,
    },
    {
      id: 'space-cubbon',
      name: 'Cubbon Park Monsoons Community Tree Drive',
      slug: 'cubbon-park-tree-drive-2026',
      occasionType: 'community',
      description: 'Volunteers planted 500 indigenous saplings across Cubbon Park. This space is preserved as a permanent digital memento of collective civic action.',
      city: 'Bengaluru',
      area: 'Kasturba Road',
      venue: 'Central Bandstand Lawn',
      coverImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
      visibility: 'public',
      inviteCode: null,
      startsAt: past7Days,
      endsAt: past2DaysEnd, // Ended!
      statusOverride: 'auto',
      archiveVisibility: 'public',
      postsRequireApproval: 0,
      createdByUserId: 'user-priya',
      createdAt: past7Days,
      updatedAt: past7Days,
    },
  ];

  for (const s of demoSpaces) {
    insertSpace.run(s);
  }

  // 3. Seed Participants
  const insertParticipant = db.prepare(`
    INSERT INTO space_participants (space_id, user_id, role, guidelines_acknowledged_at, is_banned, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertParticipant.run('space-lalbaug', 'user-priya', 'organizer', past7Days, 0, past7Days);
  insertParticipant.run('space-lalbaug', 'user-rahul', 'participant', past2Days, 0, past2Days);
  insertParticipant.run('space-lalbaug', 'user-samira', 'participant', past2Days, 0, past2Days);

  insertParticipant.run('space-wedding', 'user-priya', 'organizer', past7Days, 0, past7Days);
  insertParticipant.run('space-wedding', 'user-rahul', 'participant', past2Days, 0, past2Days);

  insertParticipant.run('space-durga', 'user-rahul', 'organizer', past7Days, 0, past7Days);
  insertParticipant.run('space-durga', 'user-priya', 'participant', past2Days, 0, past2Days);

  insertParticipant.run('space-cubbon', 'user-priya', 'organizer', past7Days, 0, past7Days);
  insertParticipant.run('space-cubbon', 'user-rahul', 'participant', past7Days, 0, past7Days);
  insertParticipant.run('space-cubbon', 'user-samira', 'participant', past7Days, 0, past7Days);

  // 4. Seed Announcements
  const insertAnnouncement = db.prepare(`
    INSERT INTO space_announcements (id, space_id, user_id, title, content, is_pinned, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAnnouncement.run(
    'ann-1',
    'space-lalbaug',
    'user-priya',
    'Evening Maha-Aarti Schedule Updated',
    'Due to heavy devotee turnout, the concluding Visarjan Aarti will take place at 8:00 PM. Please follow volunteer marshals inside the central enclosure.',
    1,
    past2Days
  );

  insertAnnouncement.run(
    'ann-2',
    'space-wedding',
    'user-priya',
    'Baraat & Sangeet Timings',
    'Baraat gathers at the North Courtyard at 6:30 PM. Royal Rajasthani dinner served immediately following the rings exchange.',
    1,
    past2Days
  );

  // 5. Seed Contributions
  const insertContribution = db.prepare(`
    INSERT INTO contributions (
      id, space_id, user_id, type, media_url, caption, 
      status, celebration_count, day_bucket, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  insertContribution.run(
    'c-1',
    'space-lalbaug',
    'user-rahul',
    'photo',
    'https://images.unsplash.com/photo-1567591414240-e9c1e59f3e06?auto=format&fit=crop&w=800&q=80',
    'The majestic evening aarti moments. May Bappa bless everyone with peace and good health. Ganpati Bappa Morya! 🙏✨',
    'approved',
    42,
    'Day 2 - Main Darshan',
    past2Days
  );

  insertContribution.run(
    'c-2',
    'space-lalbaug',
    'user-samira',
    'note',
    null,
    'Offering prayers for our family elders and community wellbeing. The disciplined devotion among thousands of people standing in line was deeply moving.',
    'approved',
    19,
    'Day 2 - Main Darshan',
    past2Days
  );

  insertContribution.run(
    'c-3',
    'space-lalbaug',
    'user-samira',
    'photo',
    'https://images.unsplash.com/photo-1609803388062-8929949f2b86?auto=format&fit=crop&w=800&q=80',
    'Modak offerings and traditional dhol tasha beats echoing through the Lalbaug precinct.',
    'approved',
    27,
    'Day 1 - Arrival',
    past7Days
  );

  // A pending contribution in the wedding space (for testing organizer approval flow)
  insertContribution.run(
    'c-wedding-pending',
    'space-wedding',
    'user-rahul',
    'photo',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80',
    'Sneha looking ethereal in her royal lehenga! Ready for the Sangeet stage dance! 🎉💃',
    'pending_approval',
    0,
    'Day 1 - Sangeet Night',
    now.toISOString()
  );

  // A test flagged note in Lalbaug (for testing platform moderation report queue)
  insertContribution.run(
    'c-flagged',
    'space-lalbaug',
    'user-samira',
    'note',
    null,
    'Check out our external discount t-shirts at festival-merch-deals.xyz/buy and call 999999999 for bulk orders!',
    'approved',
    1,
    'Day 2 - Main Darshan',
    past2Days
  );

  // 6. Seed Report
  const insertReport = db.prepare(`
    INSERT INTO reports (
      id, contribution_id, space_id, reported_by_user_id, category, 
      details, status, action_taken, reviewed_by_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReport.run(
    'rep-1',
    'c-flagged',
    'space-lalbaug',
    'user-rahul',
    'spam',
    'Promoting commercial external t-shirt sales in the sacred devotional space.',
    'pending',
    null,
    null,
    now.toISOString()
  );

  // 7. Seed Celebrations
  const insertCelebration = db.prepare(`
    INSERT INTO celebrations (contribution_id, user_id, created_at)
    VALUES (?, ?, ?)
  `);
  insertCelebration.run('c-1', 'user-priya', past2Days);
  insertCelebration.run('c-1', 'user-samira', past2Days);
  insertCelebration.run('c-2', 'user-rahul', past2Days);

  // 8. Seed Activity Log
  const insertLog = db.prepare(`
    INSERT INTO space_activity_logs (id, space_id, actor_user_id, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertLog.run(
    'log-1',
    'space-lalbaug',
    'user-priya',
    'announcement_published',
    'Published pinned bulletin: Evening Maha-Aarti Schedule Updated',
    past2Days
  );
  insertLog.run(
    'log-2',
    'space-wedding',
    'user-priya',
    'approval_mode_enabled',
    'Enabled "Contributions Require Approval" mode for private occasion safety',
    past7Days
  );
  } catch (e) {
    // Ignore concurrent seed errors during parallel worker initialization
  }
}

// Initialize on module load
initDb();

// Database Query Helpers
export function getAllUsers(): User[] {
  const rows = db.prepare('SELECT id, display_name as displayName, contact_type as contactType, contact_value as contactValue, is_verified as isVerified, role, created_at as createdAt FROM users').all();
  return rows.map((r: any) => ({
    ...r,
    isVerified: Boolean(r.isVerified),
  }));
}

export function getUserById(id: string): User | null {
  const row: any = db.prepare('SELECT id, display_name as displayName, contact_type as contactType, contact_value as contactValue, is_verified as isVerified, role, created_at as createdAt FROM users WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    isVerified: Boolean(row.isVerified),
  };
}

export function createOrVerifyUser(displayName: string, contactType: 'phone' | 'email', contactValue: string): User {
  const existing: any = db.prepare('SELECT id, display_name as displayName, contact_type as contactType, contact_value as contactValue, is_verified as isVerified, role, created_at as createdAt FROM users WHERE contact_value = ?').get(contactValue);
  
  if (existing) {
    db.prepare('UPDATE users SET is_verified = 1, display_name = ? WHERE id = ?').run(displayName, existing.id);
    return { ...existing, displayName, isVerified: true };
  }

  const id = `user-${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO users (id, display_name, contact_type, contact_value, is_verified, role, created_at)
    VALUES (?, ?, ?, ?, 1, 'user', ?)
  `).run(id, displayName, contactType, contactValue, now);

  return {
    id,
    displayName,
    contactType,
    contactValue,
    isVerified: true,
    role: 'user',
    createdAt: now,
  };
}

export function getSpaces(filters?: { city?: string; occasionType?: string; status?: string; query?: string }): Space[] {
  let query = `
    SELECT 
      s.id, s.name, s.slug, s.occasion_type as occasionType, s.description, 
      s.city, s.area, s.venue, s.cover_image_url as coverImageUrl, 
      s.visibility, s.invite_code as inviteCode, s.starts_at as startsAt, 
      s.ends_at as endsAt, s.status_override as statusOverride, 
      s.archive_visibility as archiveVisibility, s.posts_require_approval as postsRequireApproval, 
      s.created_by_user_id as createdByUserId, s.created_at as createdAt, s.updated_at as updatedAt,
      u.display_name as creatorName,
      (SELECT COUNT(*) FROM space_participants sp WHERE sp.space_id = s.id AND sp.is_banned = 0) as participantCount,
      (SELECT COUNT(*) FROM contributions c WHERE c.space_id = s.id AND c.status = 'approved') as contributionCount
    FROM spaces s
    LEFT JOIN users u ON s.created_by_user_id = u.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters?.city && filters.city !== 'all') {
    query += ' AND LOWER(s.city) = LOWER(?)';
    params.push(filters.city);
  }

  if (filters?.occasionType && filters.occasionType !== 'all') {
    query += ' AND s.occasion_type = ?';
    params.push(filters.occasionType);
  }

  if (filters?.query && filters.query.trim().length > 0) {
    query += ' AND (LOWER(s.name) LIKE ? OR LOWER(s.description) LIKE ? OR LOWER(s.area) LIKE ?)';
    const term = `%${filters.query.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY s.starts_at DESC';

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => {
    const spaceObj: Space = {
      ...r,
      postsRequireApproval: Boolean(r.postsRequireApproval),
    };
    spaceObj.status = getSpaceStatus(spaceObj);
    return spaceObj;
  }).filter((space) => {
    if (!filters?.status || filters.status === 'all') return true;
    if (filters.status === 'live') {
      return space.status === 'live' || space.status === 'ending_soon';
    }
    return space.status === filters.status;
  });
}

export function getSpaceById(idOrSlug: string): Space | null {
  const row: any = db.prepare(`
    SELECT 
      s.id, s.name, s.slug, s.occasion_type as occasionType, s.description, 
      s.city, s.area, s.venue, s.cover_image_url as coverImageUrl, 
      s.visibility, s.invite_code as inviteCode, s.starts_at as startsAt, 
      s.ends_at as endsAt, s.status_override as statusOverride, 
      s.archive_visibility as archiveVisibility, s.posts_require_approval as postsRequireApproval, 
      s.created_by_user_id as createdByUserId, s.created_at as createdAt, s.updated_at as updatedAt,
      u.display_name as creatorName,
      (SELECT COUNT(*) FROM space_participants sp WHERE sp.space_id = s.id AND sp.is_banned = 0) as participantCount,
      (SELECT COUNT(*) FROM contributions c WHERE c.space_id = s.id AND c.status = 'approved') as contributionCount
    FROM spaces s
    LEFT JOIN users u ON s.created_by_user_id = u.id
    WHERE s.id = ? OR s.slug = ?
  `).get(idOrSlug, idOrSlug);

  if (!row) return null;
  const spaceObj: Space = {
    ...row,
    postsRequireApproval: Boolean(row.postsRequireApproval),
  };
  spaceObj.status = getSpaceStatus(spaceObj);
  return spaceObj;
}

export function createSpace(data: Omit<Space, 'id' | 'createdAt' | 'updatedAt'>): Space {
  const id = `space-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO spaces (
      id, name, slug, occasion_type, description, city, area, venue, 
      cover_image_url, visibility, invite_code, starts_at, ends_at, 
      status_override, archive_visibility, posts_require_approval, created_by_user_id, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, 
      ?, ?, ?, ?, ?, 
      ?, ?, ?, ?, ?, ?
    )
  `).run(
    id, data.name, data.slug, data.occasionType, data.description, data.city, data.area, data.venue || null,
    data.coverImageUrl, data.visibility, data.inviteCode || null, data.startsAt, data.endsAt,
    data.statusOverride || 'auto', data.archiveVisibility || 'public', data.postsRequireApproval ? 1 : 0,
    data.createdByUserId, now, now
  );

  // Add creator as organizer participant
  db.prepare(`
    INSERT INTO space_participants (space_id, user_id, role, guidelines_acknowledged_at, is_banned, joined_at)
    VALUES (?, ?, 'organizer', ?, 0, ?)
  `).run(id, data.createdByUserId, now, now);

  logActivity(id, data.createdByUserId, 'space_created', `Occasion space created for "${data.name}"`);

  return getSpaceById(id)!;
}

export function updateSpace(id: string, updates: Partial<Space>, actorUserId: string): Space | null {
  const current = getSpaceById(id);
  if (!current) return null;

  const sets: string[] = [];
  const params: any[] = [];

  if (updates.name !== undefined) { sets.push('name = ?'); params.push(updates.name); }
  if (updates.description !== undefined) { sets.push('description = ?'); params.push(updates.description); }
  if (updates.city !== undefined) { sets.push('city = ?'); params.push(updates.city); }
  if (updates.area !== undefined) { sets.push('area = ?'); params.push(updates.area); }
  if (updates.venue !== undefined) { sets.push('venue = ?'); params.push(updates.venue); }
  if (updates.coverImageUrl !== undefined) { sets.push('cover_image_url = ?'); params.push(updates.coverImageUrl); }
  if (updates.startsAt !== undefined) { sets.push('starts_at = ?'); params.push(updates.startsAt); }
  if (updates.endsAt !== undefined) { sets.push('ends_at = ?'); params.push(updates.endsAt); }
  if (updates.statusOverride !== undefined) { sets.push('status_override = ?'); params.push(updates.statusOverride); }
  if (updates.archiveVisibility !== undefined) { sets.push('archive_visibility = ?'); params.push(updates.archiveVisibility); }
  if (updates.postsRequireApproval !== undefined) { sets.push('posts_require_approval = ?'); params.push(updates.postsRequireApproval ? 1 : 0); }
  if (updates.createdByUserId !== undefined) { sets.push('created_by_user_id = ?'); params.push(updates.createdByUserId); }

  if (sets.length === 0) return current;

  sets.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(id);

  db.prepare(`UPDATE spaces SET ${sets.join(', ')} WHERE id = ?`).run(...params);

  if (updates.createdByUserId !== undefined) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO space_participants (space_id, user_id, role, guidelines_acknowledged_at, is_banned, joined_at)
      VALUES (?, ?, 'organizer', ?, 0, ?)
      ON CONFLICT(space_id, user_id) DO UPDATE SET role = 'organizer'
    `).run(id, updates.createdByUserId, now, now);
    logActivity(id, actorUserId, 'ownership_transferred', `Transferred space ownership to user ${updates.createdByUserId}`);
  }

  logActivity(id, actorUserId, 'space_updated', `Updated space settings: ${sets.join(', ')}`);

  return getSpaceById(id);
}

export function getSpaceParticipants(spaceId: string): SpaceParticipant[] {
  const rows = db.prepare(`
    SELECT 
      sp.space_id as spaceId, sp.user_id as userId, sp.role, 
      sp.guidelines_acknowledged_at as guidelinesAcknowledgedAt, 
      sp.is_banned as isBanned, sp.joined_at as joinedAt,
      u.display_name as displayName, u.contact_value as contactValue
    FROM space_participants sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.space_id = ?
    ORDER BY sp.joined_at DESC
  `).all(spaceId) as any[];

  return rows.map((r) => ({
    ...r,
    isBanned: Boolean(r.isBanned),
  }));
}

export function getParticipant(spaceId: string, userId: string): SpaceParticipant | null {
  const row: any = db.prepare(`
    SELECT 
      sp.space_id as spaceId, sp.user_id as userId, sp.role, 
      sp.guidelines_acknowledged_at as guidelinesAcknowledgedAt, 
      sp.is_banned as isBanned, sp.joined_at as joinedAt,
      u.display_name as displayName, u.contact_value as contactValue
    FROM space_participants sp
    JOIN users u ON sp.user_id = u.id
    WHERE sp.space_id = ? AND sp.user_id = ?
  `).get(spaceId, userId);

  if (!row) return null;
  return { ...row, isBanned: Boolean(row.isBanned) };
}

export function joinSpace(spaceId: string, userId: string): SpaceParticipant {
  const existing = getParticipant(spaceId, userId);
  if (existing) return existing;

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO space_participants (space_id, user_id, role, guidelines_acknowledged_at, is_banned, joined_at)
    VALUES (?, ?, 'participant', NULL, 0, ?)
  `).run(spaceId, userId, now);

  logActivity(spaceId, userId, 'user_joined', 'Joined the occasion space');

  return getParticipant(spaceId, userId)!;
}

export function leaveSpace(spaceId: string, userId: string) {
  db.prepare('DELETE FROM space_participants WHERE space_id = ? AND user_id = ?').run(spaceId, userId);
  logActivity(spaceId, userId, 'user_left', 'Left the occasion space');
}

export function acknowledgeGuidelines(spaceId: string, userId: string) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO space_participants (space_id, user_id, role, guidelines_acknowledged_at, is_banned, joined_at)
    VALUES (?, ?, 'participant', ?, 0, ?)
    ON CONFLICT(space_id, user_id) DO UPDATE SET guidelines_acknowledged_at = ?
  `).run(spaceId, userId, now, now, now);
}

export function banParticipant(spaceId: string, userId: string, isBanned: boolean, actorUserId: string) {
  db.prepare('UPDATE space_participants SET is_banned = ? WHERE space_id = ? AND user_id = ?').run(isBanned ? 1 : 0, spaceId, userId);
  logActivity(spaceId, actorUserId, isBanned ? 'user_banned' : 'user_unbanned', `Participant ${userId} was ${isBanned ? 'banned' : 'unbanned'} from this space`);
}

export function getContributions(spaceId: string, currentUserId?: string, options?: { type?: string; day?: string; sort?: 'newest' | 'oldest' | 'most_celebrated'; status?: ContributionStatus }): Contribution[] {
  let query = `
    SELECT 
      c.id, c.space_id as spaceId, c.user_id as userId, c.type, 
      c.media_url as mediaUrl, c.caption, c.status, 
      c.celebration_count as celebrationCount, c.day_bucket as dayBucket, 
      c.created_at as createdAt,
      u.display_name as authorName,
      CASE WHEN cel.user_id IS NOT NULL THEN 1 ELSE 0 END as hasCelebrated
    FROM contributions c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN celebrations cel ON cel.contribution_id = c.id AND cel.user_id = ?
    WHERE c.space_id = ?
  `;

  const params: any[] = [currentUserId || '', spaceId];

  if (options?.status) {
    query += ' AND c.status = ?';
    params.push(options.status);
  } else {
    // Default to approved only, plus user's own contributions if pending
    if (currentUserId) {
      query += " AND (c.status = 'approved' OR (c.user_id = ? AND c.status = 'pending_approval'))";
      params.push(currentUserId);
    } else {
      query += " AND c.status = 'approved'";
    }
  }

  // Filter out blocked users if currentUserId provided
  if (currentUserId) {
    query += ' AND c.user_id NOT IN (SELECT blocked_user_id FROM blocked_users WHERE user_id = ?)';
    params.push(currentUserId);
  }

  if (options?.type && options.type !== 'all') {
    query += ' AND c.type = ?';
    params.push(options.type);
  }

  if (options?.day && options.day !== 'all') {
    query += ' AND c.day_bucket = ?';
    params.push(options.day);
  }

  if (options?.sort === 'most_celebrated') {
    query += ' ORDER BY c.celebration_count DESC, c.created_at DESC';
  } else if (options?.sort === 'oldest') {
    query += ' ORDER BY c.created_at ASC';
  } else {
    query += ' ORDER BY c.created_at DESC';
  }

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => ({
    ...r,
    hasCelebrated: Boolean(r.hasCelebrated),
  }));
}

export function getPendingContributions(spaceId: string): Contribution[] {
  const rows = db.prepare(`
    SELECT 
      c.id, c.space_id as spaceId, c.user_id as userId, c.type, 
      c.media_url as mediaUrl, c.caption, c.status, 
      c.celebration_count as celebrationCount, c.day_bucket as dayBucket, 
      c.created_at as createdAt,
      u.display_name as authorName
    FROM contributions c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.space_id = ? AND c.status = 'pending_approval'
    ORDER BY c.created_at ASC
  `).all(spaceId) as any[];

  return rows;
}

export function createContribution(data: {
  spaceId: string;
  userId: string;
  type: 'photo' | 'clip' | 'note';
  mediaUrl?: string;
  caption: string;
  status: ContributionStatus;
  dayBucket?: string;
}): Contribution {
  const id = `c-${Date.now()}`;
  const now = new Date().toISOString();
  const dayBucket = data.dayBucket || `Day 1 - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  db.prepare(`
    INSERT INTO contributions (
      id, space_id, user_id, type, media_url, caption, 
      status, celebration_count, day_bucket, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(
    id, data.spaceId, data.userId, data.type, 
    data.mediaUrl || null, data.caption, data.status, 
    dayBucket, now
  );

  logActivity(data.spaceId, data.userId, 'contribution_created', `Added a ${data.type} contribution`);

  return getContributionById(id)!;
}

export function getContributionById(id: string): Contribution | null {
  const row: any = db.prepare(`
    SELECT 
      c.id, c.space_id as spaceId, c.user_id as userId, c.type, 
      c.media_url as mediaUrl, c.caption, c.status, 
      c.celebration_count as celebrationCount, c.day_bucket as dayBucket, 
      c.created_at as createdAt,
      u.display_name as authorName
    FROM contributions c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(id);

  if (!row) return null;
  return row;
}

export function updateContributionStatus(id: string, status: ContributionStatus, actorUserId: string) {
  db.prepare('UPDATE contributions SET status = ? WHERE id = ?').run(status, id);
  const cont = getContributionById(id);
  if (cont) {
    logActivity(cont.spaceId, actorUserId, 'contribution_moderated', `Contribution ${id} status set to ${status}`);
  }
}

export function deleteContribution(id: string, userId: string): boolean {
  const cont = getContributionById(id);
  if (!cont) return false;

  db.prepare('DELETE FROM contributions WHERE id = ?').run(id);
  logActivity(cont.spaceId, userId, 'contribution_deleted', `Deleted contribution ${id}`);
  return true;
}

export function toggleCelebration(contributionId: string, userId: string): { celebrated: boolean; count: number } {
  const existing = db.prepare('SELECT 1 FROM celebrations WHERE contribution_id = ? AND user_id = ?').get(contributionId, userId);

  if (existing) {
    db.prepare('DELETE FROM celebrations WHERE contribution_id = ? AND user_id = ?').run(contributionId, userId);
    db.prepare('UPDATE contributions SET celebration_count = MAX(0, celebration_count - 1) WHERE id = ?').run(contributionId);
  } else {
    const now = new Date().toISOString();
    db.prepare('INSERT INTO celebrations (contribution_id, user_id, created_at) VALUES (?, ?, ?)').run(contributionId, userId, now);
    db.prepare('UPDATE contributions SET celebration_count = celebration_count + 1 WHERE id = ?').run(contributionId);
  }

  const updated: any = db.prepare('SELECT celebration_count as count FROM contributions WHERE id = ?').get(contributionId);
  return { celebrated: !existing, count: updated?.count || 0 };
}

export function getSpaceAnnouncements(spaceId: string): Announcement[] {
  const rows = db.prepare(`
    SELECT 
      sa.id, sa.space_id as spaceId, sa.user_id as userId, 
      sa.title, sa.content, sa.is_pinned as isPinned, sa.created_at as createdAt,
      u.display_name as authorName
    FROM space_announcements sa
    JOIN users u ON sa.user_id = u.id
    WHERE sa.space_id = ?
    ORDER BY sa.is_pinned DESC, sa.created_at DESC
  `).all(spaceId) as any[];

  return rows.map((r) => ({ ...r, isPinned: Boolean(r.isPinned) }));
}

export function createAnnouncement(spaceId: string, userId: string, title: string, content: string, isPinned = true): Announcement {
  const id = `ann-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO space_announcements (id, space_id, user_id, title, content, is_pinned, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, spaceId, userId, title, content, isPinned ? 1 : 0, now);

  logActivity(spaceId, userId, 'announcement_created', `Posted announcement: "${title}"`);

  return {
    id,
    spaceId,
    userId,
    title,
    content,
    isPinned,
    createdAt: now,
  };
}

export function createReport(data: {
  contributionId: string;
  spaceId: string;
  reportedByUserId: string;
  category: string;
  details: string;
}): Report {
  const id = `rep-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO reports (
      id, contribution_id, space_id, reported_by_user_id, category, 
      details, status, action_taken, reviewed_by_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, ?)
  `).run(id, data.contributionId, data.spaceId, data.reportedByUserId, data.category, data.details, now);

  return {
    id,
    contributionId: data.contributionId,
    spaceId: data.spaceId,
    reportedByUserId: data.reportedByUserId,
    category: data.category as any,
    details: data.details,
    status: 'pending',
    createdAt: now,
  };
}

export function getReports(status?: string): Report[] {
  let query = `
    SELECT 
      r.id, r.contribution_id as contributionId, r.space_id as spaceId, 
      r.reported_by_user_id as reportedByUserId, r.category, r.details, 
      r.status, r.action_taken as actionTaken, r.reviewed_by_user_id as reviewedByUserId, 
      r.created_at as createdAt,
      c.caption as contributionCaption, c.media_url as contributionMediaUrl, c.type as contributionType,
      uReporter.display_name as reporterName,
      uAuthor.display_name as authorName,
      uAuthor.id as authorUserId,
      s.name as spaceName, s.city as spaceCity
    FROM reports r
    LEFT JOIN contributions c ON r.contribution_id = c.id
    LEFT JOIN users uReporter ON r.reported_by_user_id = uReporter.id
    LEFT JOIN users uAuthor ON c.user_id = uAuthor.id
    LEFT JOIN spaces s ON r.space_id = s.id
    WHERE 1=1
  `;

  const params: any[] = [];
  if (status && status !== 'all') {
    query += ' AND r.status = ?';
    params.push(status);
  }

  query += ' ORDER BY r.created_at DESC';

  return db.prepare(query).all(...params) as Report[];
}

export function updateReportStatus(reportId: string, status: 'actioned' | 'dismissed', actionTaken: string, reviewerId: string) {
  db.prepare(`
    UPDATE reports 
    SET status = ?, action_taken = ?, reviewed_by_user_id = ? 
    WHERE id = ?
  `).run(status, actionTaken, reviewerId, reportId);
}

export function toggleBlockUser(userId: string, targetUserId: string): boolean {
  const existing = db.prepare('SELECT 1 FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?').get(userId, targetUserId);
  if (existing) {
    db.prepare('DELETE FROM blocked_users WHERE user_id = ? AND blocked_user_id = ?').run(userId, targetUserId);
    return false;
  } else {
    db.prepare('INSERT INTO blocked_users (user_id, blocked_user_id, created_at) VALUES (?, ?, ?)').run(userId, targetUserId, new Date().toISOString());
    return true;
  }
}

export function getBlockedUserIds(userId: string): string[] {
  const rows = db.prepare('SELECT blocked_user_id FROM blocked_users WHERE user_id = ?').all(userId) as any[];
  return rows.map((r) => r.blocked_user_id);
}

export function logActivity(spaceId: string, actorUserId: string, action: string, details: string) {
  const id = `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  db.prepare(`
    INSERT INTO space_activity_logs (id, space_id, actor_user_id, action, details, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, spaceId, actorUserId, action, details, new Date().toISOString());
}

export function getActivityLogs(spaceId: string): ActivityLog[] {
  const rows = db.prepare(`
    SELECT 
      sal.id, sal.space_id as spaceId, sal.actor_user_id as actorUserId, 
      sal.action, sal.details, sal.created_at as createdAt,
      u.display_name as actorName
    FROM space_activity_logs sal
    LEFT JOIN users u ON sal.actor_user_id = u.id
    WHERE sal.space_id = ?
    ORDER BY sal.created_at DESC
    LIMIT 100
  `).all(spaceId) as ActivityLog[];

  return rows;
}

export function getUserHistory(userId: string) {
  // Private history for user (FR25)
  const joinedSpaces = db.prepare(`
    SELECT 
      s.id, s.name, s.slug, s.occasion_type as occasionType, s.description, 
      s.city, s.area, s.starts_at as startsAt, s.ends_at as endsAt, 
      s.status_override as statusOverride, s.cover_image_url as coverImageUrl,
      sp.role as myRole, sp.joined_at as joinedAt
    FROM space_participants sp
    JOIN spaces s ON sp.space_id = s.id
    WHERE sp.user_id = ? AND sp.is_banned = 0
    ORDER BY sp.joined_at DESC
  `).all(userId) as any[];

  const myContributions = db.prepare(`
    SELECT 
      c.id, c.space_id as spaceId, c.type, c.media_url as mediaUrl, 
      c.caption, c.status, c.celebration_count as celebrationCount, 
      c.created_at as createdAt, s.name as spaceName
    FROM contributions c
    JOIN spaces s ON c.space_id = s.id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId) as any[];

  return {
    spaces: joinedSpaces.map((s) => ({
      ...s,
      status: getSpaceStatus(s),
    })),
    contributions: myContributions,
  };
}
