import { NextRequest, NextResponse } from 'next/server';
import { getSpaceById, getParticipant, joinSpace, leaveSpace, acknowledgeGuidelines, getUserById } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    if (!userId) {
      return NextResponse.json({ participant: null });
    }

    const participant = getParticipant(space.id, userId);
    return NextResponse.json({ participant });
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
    const { userId, inviteCode, acknowledgeGuidelinesNow } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User identity required' }, { status: 401 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    let participant = getParticipant(space.id, userId);

    // If user is not yet a participant and space is invite-only, validate invite code
    if (!participant && space.visibility === 'invite_only' && space.createdByUserId !== userId && !acknowledgeGuidelinesNow) {
      const validCode = space.inviteCode?.trim().toUpperCase();
      const providedCode = inviteCode?.trim().toUpperCase();
      if (!providedCode || providedCode !== validCode) {
        return NextResponse.json({ 
          error: `A valid invite code is required to join this private occasion (e.g. ${space.inviteCode || 'INVITE'})` 
        }, { status: 403 });
      }
    }

    if (!participant) {
      participant = joinSpace(space.id, userId);
    }

    if (acknowledgeGuidelinesNow) {
      acknowledgeGuidelines(space.id, userId);
      participant = getParticipant(space.id, userId)!;
    }

    return NextResponse.json({ participant, message: 'Joined occasion space successfully' });
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User identity required' }, { status: 400 });
    }

    const space = getSpaceById(id);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    leaveSpace(space.id, userId);
    return NextResponse.json({ message: 'Left occasion space' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
