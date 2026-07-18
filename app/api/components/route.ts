import { NextRequest, NextResponse } from 'next/server';
import { Component } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const brand = searchParams.get('brand');

    if (!type) {
      return NextResponse.json(
        { success: false, message: 'Component type is required' },
        { status: 400 }
      );
    }

    // This would normally load from precompiled JSON files
    // For now, return empty array - actual data loaded from ai-helpers
    const components: Component[] = [];

    return NextResponse.json({
      success: true,
      components,
      count: components.length,
    });
  } catch (error) {
    console.error('Get components error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
