import { NextRequest, NextResponse } from 'next/server';
import { 
  getReports, createReport, updateReportStatus, 
  updateContributionStatus, getUserById 
} from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const reports = getReports(status);
    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contributionId, spaceId, reportedByUserId, category, details } = body;

    if (!contributionId || !spaceId || !reportedByUserId || !category) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    const report = createReport({
      contributionId,
      spaceId,
      reportedByUserId,
      category,
      details: details?.trim() || 'No additional details provided.',
    });

    return NextResponse.json({ 
      report, 
      message: 'Thank you. The report has been queued for safety review.' 
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportId, reviewerUserId, action, notes } = body;

    if (!reportId || !reviewerUserId || !action) {
      return NextResponse.json({ error: 'Missing review action parameters' }, { status: 400 });
    }

    const reviewer = getUserById(reviewerUserId);
    if (!reviewer || reviewer.role !== 'platform_moderator') {
      return NextResponse.json({ error: 'Only designated platform safety moderators can act on this queue' }, { status: 403 });
    }

    const reports = getReports('all');
    const targetReport = reports.find((r) => r.id === reportId);
    if (!targetReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (action === 'takedown_content') {
      updateContributionStatus(targetReport.contributionId, 'removed', reviewerUserId);
      updateReportStatus(reportId, 'actioned', notes || 'Content removed for safety violation', reviewerUserId);
      return NextResponse.json({ message: 'Content taken down and report marked actioned' });
    }

    if (action === 'dismiss') {
      updateReportStatus(reportId, 'dismissed', notes || 'Reviewed and dismissed as conforming to guidelines', reviewerUserId);
      return NextResponse.json({ message: 'Report dismissed' });
    }

    return NextResponse.json({ error: 'Invalid moderation action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
