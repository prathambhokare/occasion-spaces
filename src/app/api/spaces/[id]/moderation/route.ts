import { NextRequest, NextResponse } from 'next/server';
import { 
  getSpaceById, getPendingContributions, getSpaceParticipants, 
  getActivityLogs, updateContributionStatus, banParticipant, 
  updateSpace, getParticipant 
} from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Organizer identity required' }, { status: 401 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const participant = getParticipant(space.id, userId);
    const isOrganizer = space.createdByUserId === userId || participant?.role === 'organizer';

    if (!isOrganizer) {
      return NextResponse.json({ error: 'Access restricted to space organizers' }, { status: 403 });
    }

    const pendingContributions = getPendingContributions(space.id);
    const participants = getSpaceParticipants(space.id);
    const activityLogs = getActivityLogs(space.id);

    return NextResponse.json({
      space,
      pendingContributions,
      participants,
      activityLogs,
    });
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
    const { actorUserId, action, targetContributionId, targetUserId, isBanned } = body;

    if (!actorUserId || !action) {
      return NextResponse.json({ error: 'Actor identity and action are required' }, { status: 400 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const participant = getParticipant(space.id, actorUserId);
    const isOrganizer = space.createdByUserId === actorUserId || participant?.role === 'organizer';

    if (!isOrganizer) {
      return NextResponse.json({ error: 'Unauthorized: organizer rights required' }, { status: 403 });
    }

    if (action === 'approve_contribution' && targetContributionId) {
      updateContributionStatus(targetContributionId, 'approved', actorUserId);
      return NextResponse.json({ message: 'Contribution approved for the space feed' });
    }

    if (action === 'reject_contribution' && targetContributionId) {
      updateContributionStatus(targetContributionId, 'rejected', actorUserId);
      return NextResponse.json({ message: 'Contribution rejected' });
    }

    if (action === 'remove_contribution' && targetContributionId) {
      updateContributionStatus(targetContributionId, 'removed', actorUserId);
      return NextResponse.json({ message: 'Contribution removed from the space' });
    }

    if (action === 'set_user_ban' && targetUserId) {
      banParticipant(space.id, targetUserId, Boolean(isBanned), actorUserId);
      return NextResponse.json({ 
        message: isBanned ? 'Participant restricted from this space' : 'Participant restriction lifted' 
      });
    }

    return NextResponse.json({ error: 'Unknown moderation action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
