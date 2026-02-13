import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { messageIds, senderId } = body;

    // Mark specific messages as read
    if (messageIds && Array.isArray(messageIds)) {
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
          recipientId: currentUser.userId,
          status: { not: 'read' },
        },
        data: {
          status: 'read',
        },
      });
    }

    // Mark all messages from a specific sender as read
    if (senderId) {
      await prisma.message.updateMany({
        where: {
          senderId: senderId,
          recipientId: currentUser.userId,
          status: { not: 'read' },
        },
        data: {
          status: 'read',
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
