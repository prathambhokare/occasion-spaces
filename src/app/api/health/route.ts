import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;

  try {
    const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'occasion_spaces.db');
    const testDb = new Database(dbPath, { readonly: true, timeout: 3000 });
    const row = testDb.prepare('SELECT 1 as alive').get() as { alive: number } | undefined;
    testDb.close();

    if (row && row.alive === 1) {
      dbStatus = 'connected';
      dbLatencyMs = Date.now() - startTime;
    }
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const isHealthy = dbStatus === 'connected';
  const mem = process.memoryUsage();

  const healthPayload = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    memory: {
      heapUsedMb: (mem.heapUsed / (1024 * 1024)).toFixed(1),
      heapTotalMb: (mem.heapTotal / (1024 * 1024)).toFixed(1),
      rssMb: (mem.rss / (1024 * 1024)).toFixed(1),
    },
  };

  return NextResponse.json(healthPayload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
