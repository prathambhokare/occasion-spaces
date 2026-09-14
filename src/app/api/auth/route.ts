import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserById, createOrVerifyUser } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { displayName, contactType, contactValue } = body;

    if (!displayName || !contactType || !contactValue) {
      return NextResponse.json({ error: 'Display name and contact info are required' }, { status: 400 });
    }

    const user = createOrVerifyUser(displayName.trim(), contactType, contactValue.trim());
    return NextResponse.json({ user, message: 'Identity verified successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
