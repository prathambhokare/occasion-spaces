import { NextRequest, NextResponse } from 'next/server';
import { createVerificationCode, verifyCode, createOrVerifyUser, createSession, getUserById } from '@/lib/db';
import { checkOtpRateLimit, recordOtpVerifyAttempt } from '@/lib/safety';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, contactType, contactValue, displayName, code } = body;

    if (!contactType || !contactValue) {
      return NextResponse.json({ error: 'Contact type and value are required' }, { status: 400 });
    }

    const cleanContactValue = contactValue.trim();
    const isEmail = contactType === 'email';

    // Basic format validation
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContactValue)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (!isEmail && cleanContactValue.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'Please enter a valid phone number (at least 8 digits)' }, { status: 400 });
    }

    if (action === 'send') {
      // 1. Rate-limit OTP requests (max 3 per 10 minutes per recipient)
      const rateCheck = checkOtpRateLimit(cleanContactValue, 3, 10);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: `Too many verification requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
          { status: 429 }
        );
      }

      const { code: generatedCode, expiresAt } = createVerificationCode(contactType, cleanContactValue);

      // Log OTP code for observability and testing
      console.log(`\n========================================`);
      console.log(`[AUTH OTP DISPATCH]`);
      console.log(`Recipient: ${cleanContactValue} (${contactType})`);
      console.log(`Verification Code: ${generatedCode}`);
      console.log(`Expires At: ${expiresAt}`);
      console.log(`========================================\n`);

      // In production, only expose previewCode if explicit demo mode is set
      const isProduction = process.env.NODE_ENV === 'production';
      const allowPreview = !isProduction || process.env.ALLOW_DEMO_AUTH === 'true';

      return NextResponse.json({
        success: true,
        message: `Verification code dispatched to ${cleanContactValue}`,
        expiresAt,
        ...(allowPreview ? { previewCode: generatedCode } : {}),
      });
    }

    if (action === 'verify') {
      if (!code || typeof code !== 'string') {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
      }

      // Check brute-force attempts
      const attemptCheck = recordOtpVerifyAttempt(cleanContactValue, false);
      if (!attemptCheck.allowed) {
        return NextResponse.json(
          { error: 'Maximum verification attempts exceeded. Please request a new verification code.' },
          { status: 429 }
        );
      }

      const isValid = verifyCode(contactType, cleanContactValue, code.trim());
      if (!isValid) {
        return NextResponse.json(
          { 
            error: `Invalid or expired verification code. (${attemptCheck.remainingAttempts} attempts remaining)` 
          }, 
          { status: 400 }
        );
      }

      // Verification successful: reset failed attempt counter
      recordOtpVerifyAttempt(cleanContactValue, true);

      const user = createOrVerifyUser(
        displayName?.trim() || cleanContactValue.split('@')[0] || 'Attendee',
        contactType,
        cleanContactValue
      );

      const session = createSession(user.id);

      const res = NextResponse.json({
        success: true,
        user,
        message: 'Verified and logged in successfully',
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

    return NextResponse.json({ error: 'Invalid action. Expected "send" or "verify".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

