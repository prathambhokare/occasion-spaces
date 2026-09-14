import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, registerWithPassword, createSession } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, contactValue, password, displayName, contactType } = body;

    if (!contactValue || typeof contactValue !== 'string') {
      return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const cleanContact = contactValue.trim();

    if (action === 'login') {
      const user = verifyPassword(cleanContact, password);
      if (!user) {
        return NextResponse.json({ error: 'Invalid contact value or password. Please check your credentials.' }, { status: 401 });
      }

      const session = createSession(user.id);
      const res = NextResponse.json({
        success: true,
        user,
        message: 'Logged in successfully',
      });

      res.cookies.set({
        name: 'occasion_session',
        value: session.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return res;
    }

    if (action === 'register') {
      if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
        return NextResponse.json({ error: 'Display name must be at least 2 characters long' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      const detectedContactType: 'phone' | 'email' = 
        contactType || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact) ? 'email' : 'phone');

      const user = registerWithPassword(displayName.trim(), detectedContactType, cleanContact, password);
      const session = createSession(user.id);

      const res = NextResponse.json({
        success: true,
        user,
        message: 'Account created and logged in successfully',
      });

      res.cookies.set({
        name: 'occasion_session',
        value: session.id,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return res;
    }

    return NextResponse.json({ error: 'Invalid action. Expected "login" or "register".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

