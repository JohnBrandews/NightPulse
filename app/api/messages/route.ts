import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { moderateContent } from '@/lib/utils/contentModeration';
import { broadcastMessage } from './stream/utils';
import { z } from 'zod';

const messageSchema = z.object({
  recipient: z.string(),
  content: z.string().min(1).max(1000),
  type: z.enum(['message', 'club_invite']).default('message'),
  relatedClub: z.string().optional(),
  relatedEvent: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = messageSchema.parse(body);

    // Moderate content
    const moderation = moderateContent(validatedData.content);
    if (!moderation.isSafe) {
      return NextResponse.json(
        { error: moderation.reason },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUser.userId,
        recipientId: validatedData.recipient,
        content: moderation.moderatedContent || validatedData.content,
        type: validatedData.type,
        relatedClubId: validatedData.relatedClub,
        relatedEventId: validatedData.relatedEvent,
        isModerated: true,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // Broadcast the new message to the recipient in real-time
    await broadcastMessage(validatedData.recipient, message);

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationWith = searchParams.get('with');

    if (conversationWith) {
      // Get messages with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUser.userId, recipientId: conversationWith },
            { senderId: conversationWith, recipientId: currentUser.userId },
          ],
          isBlocked: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isOnline: true,
              lastActive: true,
            },
          },
          recipient: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isOnline: true,
              lastActive: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json({ messages });
    } else {
      // Get all conversations
      const sentMessages = await prisma.message.findMany({
        where: { senderId: currentUser.userId },
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isOnline: true,
              lastActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      const receivedMessages = await prisma.message.findMany({
        where: { recipientId: currentUser.userId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              isOnline: true,
              lastActive: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Combine and deduplicate conversations
      const conversations = new Map();
      
      sentMessages.forEach(msg => {
        const otherUserId = msg.recipient.id;
        if (!conversations.has(otherUserId)) {
          conversations.set(otherUserId, {
            user: msg.recipient,
            lastMessage: msg,
            unread: 0,
          });
        }
      });

      receivedMessages.forEach(msg => {
        const otherUserId = msg.sender.id;
        const isUnread = msg.status !== 'read';
        if (!conversations.has(otherUserId)) {
          conversations.set(otherUserId, {
            user: msg.sender,
            lastMessage: msg,
            unread: isUnread ? 1 : 0,
          });
        } else {
          const conv = conversations.get(otherUserId);
          if (msg.createdAt > conv.lastMessage.createdAt) {
            conv.lastMessage = msg;
          }
          if (isUnread) {
            conv.unread += 1;
          }
        }
      });

      return NextResponse.json({ conversations: Array.from(conversations.values()) });
    }
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}
