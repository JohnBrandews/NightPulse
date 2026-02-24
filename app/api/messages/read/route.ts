export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { broadcastStatusUpdate } from '../stream/utils';

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
      // Broadcast status update to senders
      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: { senderId: true },
      });
      const senderIds = Array.from(new Set(messages.map(m => m.senderId)));
      for (const senderId of senderIds) {
        await broadcastStatusUpdate(senderId, messageIds, 'read');
      }
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
      // Broadcast status update to sender
      await broadcastStatusUpdate(senderId, [], 'read');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark messages read error:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
