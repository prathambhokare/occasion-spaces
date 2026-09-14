import { NextRequest, NextResponse } from 'next/server';
import { getSpaceAnnouncements, createAnnouncement, getSpaceById, getParticipant } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const announcements = getSpaceAnnouncements(id);
    return NextResponse.json({ announcements });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, title, content, isPinned } = body;

    if (!userId || !title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const participant = getParticipant(space.id, userId);
    const isOrganizer = space.createdByUserId === userId || participant?.role === 'organizer';

    if (!isOrganizer) {
      return NextResponse.json({ error: 'Only space organizers can post pinned announcements' }, { status: 403 });
    }

    const announcement = createAnnouncement(space.id, userId, title.trim(), content.trim(), isPinned ?? true);
    return NextResponse.json({ announcement, message: 'Announcement published successfully' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
