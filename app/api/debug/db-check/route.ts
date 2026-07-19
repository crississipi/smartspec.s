import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      usersCount: users.length,
      users,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
