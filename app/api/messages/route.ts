import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { processAIMessage } from '@/lib/aiService';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { threadId, message } = await req.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }

    // Get user from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let thread;
    const isNewThread = !threadId;

    // Create or get thread
    if (isNewThread) {
      // Generate title from message (first 50 chars or AI-generated)
      const title = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      thread = await prisma.thread.create({
        data: {
          userId: user.id,
          title,
        },
      });
    } else {
      thread = await prisma.thread.findFirst({
        where: {
          id: parseInt(threadId),
          userId: user.id,
        },
      });

      if (!thread) {
        return NextResponse.json({ success: false, message: 'Thread not found' }, { status: 404 });
      }
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        threadId: thread.id,
        role: 'user',
        content: message,
      },
    });

    // Get conversation history for context
    const history = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: {
        role: true,
        content: true,
      },
    });

    // Process AI response
    const aiResponseData = await processAIMessage(message, thread.id, history);

    if (!aiResponseData.success) {
      return NextResponse.json({
        success: false,
        message: aiResponseData.message || 'AI processing failed',
      });
    }

    const { data } = aiResponseData;
    const content = data.type === 'recommendation' || data.type === 'upgrade_suggestion' 
      ? JSON.stringify(data) 
      : data.ai_message;

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        threadId: thread.id,
        role: 'assistant',
        content,
        dataType: data.type || 'text',
        recommendationId: aiResponseData.recommendation_id || null,
      },
    });

    // Update thread timestamp
    await prisma.thread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      thread_id: thread.id,
      thread_title: thread.title,
      is_new_thread: isNewThread,
      request_id: aiResponseData.request_id || null,
      user_message: {
        id: userMessage.id,
        role: 'user',
        content: message,
      },
      ai_message: {
        id: aiMessage.id,
        role: 'assistant',
        content,
        data_type: data.type,
        data: data.type === 'recommendation' || data.type === 'upgrade_suggestion' ? data : null,
      },
    });
  } catch (error: any) {
    console.error('Message API error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
