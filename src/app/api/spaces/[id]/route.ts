import { NextRequest, NextResponse } from 'next/server';
import { getSpaceById, updateSpace, getParticipant } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Occasion space not found' }, { status: 404 });
    }
    return NextResponse.json({ space });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { actorUserId, updates } = body;

    if (!actorUserId) {
      return NextResponse.json({ error: 'Unauthorized: actor identity required' }, { status: 401 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Occasion space not found' }, { status: 404 });
    }

    // Verify actor is the creator or an organizer
    const participant = getParticipant(space.id, actorUserId);
    const isOrganizer = space.createdByUserId === actorUserId || participant?.role === 'organizer';

    if (!isOrganizer) {
      return NextResponse.json({ error: 'Only space organizers can modify space settings' }, { status: 403 });
    }

    const updatedSpace = updateSpace(space.id, updates, actorUserId);
    return NextResponse.json({ space: updatedSpace, message: 'Space updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
