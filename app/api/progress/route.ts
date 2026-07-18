import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory progress tracking (use Redis in production)
const progressMap = new Map<string, any>();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('request_id');

    if (!requestId) {
      return NextResponse.json(
        { success: false, message: 'request_id is required' },
        { status: 400 }
      );
    }

    const progress = progressMap.get(requestId) || {
      currentPhase: 'Processing',
      percentage: 0,
      phases: [],
    };

    return NextResponse.json({
      success: true,
      requestId,
      progress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export function updateProgress(requestId: string, phase: string, percentage: number) {
  progressMap.set(requestId, {
    currentPhase: phase,
    percentage,
    phases: [],
  });

  // Clean up old entries (older than 30 minutes)
  const now = Date.now();
  for (const [key, value] of progressMap.entries()) {
    if (now - (value.timestamp || now) > 30 * 60 * 1000) {
      progressMap.delete(key);
    }
  }
}
