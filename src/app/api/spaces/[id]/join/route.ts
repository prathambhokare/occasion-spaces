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

    // Check invite code if space is invite-only
    if (space.visibility === 'invite_only' && space.createdByUserId !== userId) {
      if (!inviteCode || inviteCode.trim().toUpperCase() !== space.inviteCode?.toUpperCase()) {
        return NextResponse.json({ error: 'A valid invite code is required to join this private occasion' }, { status: 403 });
      }
    }

    let participant = joinSpace(space.id, userId);

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
