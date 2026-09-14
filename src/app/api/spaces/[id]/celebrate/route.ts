import { NextRequest, NextResponse } from 'next/server';
import { toggleCelebration, getUserById } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { contributionId, userId } = body;

    if (!contributionId || !userId) {
      return NextResponse.json({ error: 'Missing contribution ID or user ID' }, { status: 400 });
    }

    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User identity required' }, { status: 401 });
    }

    const result = toggleCelebration(contributionId, userId);
    return NextResponse.json({ ...result, message: result.celebrated ? 'Celebrated!' : 'Celebration removed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
