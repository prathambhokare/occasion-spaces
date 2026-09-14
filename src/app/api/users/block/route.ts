import { NextRequest, NextResponse } from 'next/server';
import { toggleBlockUser, getBlockedUserIds } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ blockedUserIds: [] });
    }
    const blockedUserIds = getBlockedUserIds(userId);
    return NextResponse.json({ blockedUserIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, targetUserId } = body;

    if (!userId || !targetUserId) {
      return NextResponse.json({ error: 'Missing userId or targetUserId' }, { status: 400 });
    }

    if (userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const isBlocked = toggleBlockUser(userId, targetUserId);
    return NextResponse.json({ 
      isBlocked, 
      message: isBlocked ? 'User blocked. You will not see their contributions.' : 'User unblocked.' 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
