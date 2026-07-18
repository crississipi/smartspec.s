import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: {
          nightMode: user.preferences?.nightMode || false,
        },
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { nightMode, name } = data;

    const userId = parseInt(session.user.id);

    // Update preferences if provided
    if (typeof nightMode === 'boolean') {
      await prisma.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          nightMode,
        },
        update: {
          nightMode,
        },
      });
    }

    // Update user name if provided
    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { preferences: true },
    });

    return NextResponse.json({
      success: true,
      message: 'User preferences updated',
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        preferences: {
          nightMode: user?.preferences?.nightMode || false,
        },
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
