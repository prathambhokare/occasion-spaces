import { NextRequest, NextResponse } from 'next/server';
import { 
  getSpaceById, getContributions, createContribution, 
  deleteContribution, getParticipant, getUserById, 
  acknowledgeGuidelines 
} from '@/lib/db';
import { checkContentSafety, checkRateLimit } from '@/lib/safety';
import { isSpaceOpenForContributions } from '@/lib/lifecycle';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const type = searchParams.get('type') || undefined;
    const day = searchParams.get('day') || undefined;
    const sort = (searchParams.get('sort') as 'newest' | 'oldest' | 'most_celebrated') || 'newest';

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Occasion space not found' }, { status: 404 });
    }

    const contributions = getContributions(space.id, userId, { type, day, sort });
    return NextResponse.json({ contributions });
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
    const { userId, type, mediaUrl, caption, dayBucket, acknowledgeGuidelinesNow } = body;

    if (!userId || !type || !caption) {
      return NextResponse.json({ error: 'Missing required contribution details' }, { status: 400 });
    }

    const user = getUserById(userId);
    if (!user || !user.isVerified) {
      return NextResponse.json({ error: 'A verified phone or email is required before contributing to this occasion.' }, { status: 403 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Occasion space not found' }, { status: 404 });
    }

    // 1. Check space lifecycle
    if (!space.status || !isSpaceOpenForContributions(space.status)) {
      return NextResponse.json({ 
        error: `This occasion is currently ${space.status}. New contributions can only be added while the space is Live.` 
      }, { status: 403 });
    }

    // 2. Check participant status & ban
    let participant = getParticipant(space.id, userId);
    if (participant && participant.isBanned) {
      return NextResponse.json({ error: 'You have been restricted from posting in this specific occasion space.' }, { status: 403 });
    }

    // 3. Acknowledge guidelines if requested or verify acknowledged
    if (acknowledgeGuidelinesNow) {
      acknowledgeGuidelines(space.id, userId);
      participant = getParticipant(space.id, userId);
    } else if (!participant || !participant.guidelinesAcknowledgedAt) {
      return NextResponse.json({ 
        requiresGuidelines: true, 
        error: 'Please review and acknowledge the community guidelines before your first contribution.' 
      }, { status: 400 });
    }

    // 4. Rate Limiting Check (FR29)
    const rateCheck = checkRateLimit(userId, 5, 15);
    if (!rateCheck.allowed) {
      return NextResponse.json({ 
        error: `Rate limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds before adding more contributions.` 
      }, { status: 429 });
    }

    // 5. Automated Content Safety Filter (FR30)
    const safetyCheck = checkContentSafety(caption);
    if (!safetyCheck.allowed) {
      return NextResponse.json({ 
        error: safetyCheck.reason, 
        flagCategory: safetyCheck.flagCategory 
      }, { status: 422 });
    }

    // 6. Approval Mode check (FR27)
    // If space requires approval and user is not organizer, set status to pending_approval
    const isOrganizer = space.createdByUserId === userId || participant?.role === 'organizer';
    const status = (space.postsRequireApproval && !isOrganizer) ? 'pending_approval' : 'approved';

    const contribution = createContribution({
      spaceId: space.id,
      userId,
      type,
      mediaUrl: mediaUrl || undefined,
      caption: caption.trim(),
      status,
      dayBucket,
    });

    const message = status === 'pending_approval' 
      ? 'Your contribution was submitted for organizer review.'
      : 'Added to the celebration!';

    return NextResponse.json({ contribution, message }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const contributionId = searchParams.get('contributionId');
    const userId = searchParams.get('userId');

    if (!contributionId || !userId) {
      return NextResponse.json({ error: 'Missing contribution ID or user ID' }, { status: 400 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const participant = getParticipant(space.id, userId);
    const isOrganizer = space.createdByUserId === userId || participant?.role === 'organizer';

    // deleteContribution allows author or organizer
    const success = deleteContribution(contributionId, userId);
    if (!success) {
      return NextResponse.json({ error: 'Contribution not found or could not be removed' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Contribution removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
