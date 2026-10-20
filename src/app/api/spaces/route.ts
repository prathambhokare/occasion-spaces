import { NextRequest, NextResponse } from 'next/server';
import { getSpaces, createSpace, getUserById } from '@/lib/db';
import { verifyUserAuthorization } from '@/lib/auth-server';
import { sanitizeText } from '@/lib/safety';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || undefined;
    const status = searchParams.get('status') || undefined;
    const occasionType = searchParams.get('occasionType') || undefined;
    const query = searchParams.get('query') || undefined;

    const spaces = getSpaces({ city, status, occasionType, query });
    return NextResponse.json({ spaces });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      occasionType,
      description,
      city,
      area,
      venue,
      coverImageUrl,
      visibility,
      inviteCode,
      startsAt,
      endsAt,
      archiveVisibility,
      postsRequireApproval,
      createdByUserId,
    } = body;

    if (!name || !occasionType || !description || !city || !area || !startsAt || !endsAt || !createdByUserId) {
      return NextResponse.json({ error: 'Missing required occasion details' }, { status: 400 });
    }

    // Verify authenticated session authorization
    const authCheck = await verifyUserAuthorization(req, createdByUserId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error || 'Unauthorized to create occasion.' }, { status: 403 });
    }

    const creator = authCheck.user || getUserById(createdByUserId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator identity not found' }, { status: 401 });
    }

    const sanitizedName = sanitizeText(name);
    const sanitizedDesc = sanitizeText(description);
    const sanitizedCity = sanitizeText(city);
    const sanitizedArea = sanitizeText(area);
    const sanitizedVenue = venue ? sanitizeText(venue) : undefined;

    const slug = `${sanitizedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const space = createSpace({
      name: sanitizedName,
      slug,
      occasionType,
      description: sanitizedDesc,
      city: sanitizedCity,
      area: sanitizedArea,
      venue: sanitizedVenue,
      coverImageUrl: coverImageUrl?.trim() || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      visibility: visibility || 'public',
      inviteCode: visibility === 'invite_only' ? (inviteCode?.trim() || 'OCCASION-' + Math.floor(1000 + Math.random() * 9000)) : undefined,
      startsAt,
      endsAt,
      statusOverride: 'auto',
      archiveVisibility: archiveVisibility || 'public',
      postsRequireApproval: Boolean(postsRequireApproval),
      createdByUserId: creator.id,
    });

    return NextResponse.json({ space, message: 'Occasion space created successfully' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
