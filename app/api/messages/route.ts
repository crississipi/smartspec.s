import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { processMessage, type ConversationMessage } from '@/lib/aiServiceNew';

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

    // Get conversation history for context (last 10 messages)
    const historyRecords = await prisma.message.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: {
        role: true,
        content: true,
        dataType: true,
      },
    });

    // Convert to ConversationMessage format
    const conversationHistory: ConversationMessage[] = historyRecords.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      data_type: msg.dataType || undefined,
    }));

    // Process AI response with new architecture
    console.log('[API] Processing message with new AI service...');
    const aiResult = await processMessage(message, conversationHistory);

    if (!aiResult.success) {
      console.error('[API] AI processing failed:', aiResult.error);
      return NextResponse.json({
        success: false,
        message: aiResult.error || 'AI processing failed',
      }, { status: 500 });
    }

    console.log(`[API] AI processing successful. Intent: ${aiResult.intent}, Data type: ${aiResult.data_type}`);
    console.log('[API] AI result data:', JSON.stringify(aiResult.data, null, 2));

    // Determine content to save
    let content: string;
    let dataType: string;

    if (aiResult.data_type === 'recommendation' || aiResult.data_type === 'upgrade_suggestion') {
      // Save structured data as JSON
      content = JSON.stringify(aiResult.data);
      dataType = aiResult.data_type;
      console.log('[API] Saving as structured JSON. Data type:', dataType);
      console.log('[API] Content to save:', content.substring(0, 200) + '...');
    } else {
      // Save text response
      content = aiResult.response;
      dataType = 'text';
      console.log('[API] Saving as text response');
    }

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        threadId: thread.id,
        role: 'assistant',
        content,
        dataType,
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
      intent: aiResult.intent,
      user_message: {
        id: userMessage.id,
        role: 'user',
        content: message,
      },
      ai_message: {
        id: aiMessage.id,
        role: 'assistant',
        content: aiResult.response,
        data_type: dataType,
        data: aiResult.data || null,
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
