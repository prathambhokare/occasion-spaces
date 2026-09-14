import { NextRequest, NextResponse } from 'next/server';
import { getSession, deleteSession } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('occasion_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ user: null, session: null });
    }

    const sessionData = getSession(sessionId);
    if (!sessionData) {
      const res = NextResponse.json({ user: null, session: null });
      res.cookies.set({
        name: 'occasion_session',
        value: '',
        maxAge: 0,
        path: '/',
      });
      return res;
    }

    return NextResponse.json({
      user: sessionData.user,
      session: sessionData.session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('occasion_session')?.value;
    if (sessionId) {
      deleteSession(sessionId);
    }

    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
    res.cookies.set({
      name: 'occasion_session',
      value: '',
      maxAge: 0,
      path: '/',
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

