import { NextRequest, NextResponse } from 'next/server';
import { exportUserContributions, exportFullSpaceArchive } from '@/lib/export';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing export type or ID' }, { status: 400 });
    }

    if (type === 'user') {
      const data = exportUserContributions(id);
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="my-occasion-contributions-${Date.now()}.json"`,
        },
      });
    }

    if (type === 'space') {
      const data = exportFullSpaceArchive(id);
      if (!data) {
        return NextResponse.json({ error: 'Occasion space not found' }, { status: 404 });
      }
      return new NextResponse(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${data.occasionSpace.slug}-full-archive-${Date.now()}.json"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
