import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserById, createOrVerifyUser, createSession } from '@/lib/db';

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
    const session = createSession(user.id);

    const res = NextResponse.json({ user, message: 'Identity verified successfully' });
    res.cookies.set({
      name: 'occasion_session',
      value: session.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
