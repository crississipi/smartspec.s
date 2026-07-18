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

    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('id');

    const userId = parseInt(session.user.id);

    // Get single thread with messages
    if (threadId) {
      const thread = await prisma.thread.findUnique({
        where: { id: parseInt(threadId) },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!thread || thread.userId !== userId) {
        return NextResponse.json(
          { success: false, message: 'Thread not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        thread: {
          id: thread.id,
          title: thread.title,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          messages: thread.messages.map((msg: typeof thread.messages[0]) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            dataType: msg.dataType,
            recommendationId: msg.recommendationId,
            createdAt: msg.createdAt,
          })),
        },
      });
    }

    // Get all threads for user
    const threads = await prisma.thread.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      threads,
    });
  } catch (error) {
    console.error('Get threads error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    const { title } = data;

    const userId = parseInt(session.user.id);

    const thread = await prisma.thread.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });

    return NextResponse.json({
      success: true,
      thread: {
        id: thread.id,
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create thread error:', error);
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
    const { id, title } = data;
    const userId = parseInt(session.user.id);

    // Verify thread belongs to user
    const thread = await prisma.thread.findUnique({
      where: { id },
    });

    if (!thread || thread.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Thread not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.thread.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json({
      success: true,
      message: 'Thread updated',
      thread: {
        id: updated.id,
        title: updated.title,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update thread error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const threadId = parseInt(searchParams.get('id') || '0');

    const userId = parseInt(session.user.id);

    // Verify thread belongs to user
    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
    });

    if (!thread || thread.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Thread not found' },
        { status: 404 }
      );
    }

    // Delete thread (messages will cascade delete)
    await prisma.thread.delete({
      where: { id: threadId },
    });

    return NextResponse.json({
      success: true,
      message: 'Thread deleted successfully',
    });
  } catch (error) {
    console.error('Delete thread error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}
