import { NextRequest, NextResponse } from 'next/server';
import { getSpaces, createSpace, getUserById } from '@/lib/db';

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

    const creator = getUserById(createdByUserId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator identity not found' }, { status: 401 });
    }

    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const space = createSpace({
      name: name.trim(),
      slug,
      occasionType,
      description: description.trim(),
      city: city.trim(),
      area: area.trim(),
      venue: venue?.trim() || undefined,
      coverImageUrl: coverImageUrl?.trim() || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      visibility: visibility || 'public',
      inviteCode: visibility === 'invite_only' ? (inviteCode?.trim() || 'OCCASION-' + Math.floor(1000 + Math.random() * 9000)) : undefined,
      startsAt,
      endsAt,
      statusOverride: 'auto',
      archiveVisibility: archiveVisibility || 'public',
      postsRequireApproval: Boolean(postsRequireApproval),
      createdByUserId,
    });

    return NextResponse.json({ space, message: 'Occasion space created successfully' }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
