export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { userConnections, cleanupConnection, broadcastMessage, broadcastStatusUpdate } from './utils';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    let isConnected = true;

    // Create a new ReadableStream for this connection
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Store the connection
        if (!userConnections.has(currentUser.userId)) {
          userConnections.set(currentUser.userId, new Set());
        }
        userConnections.get(currentUser.userId)!.add(controller);

        // Send initial connection confirmation
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', userId: currentUser.userId })}\n\n`));

        // Send any pending unread messages count
        try {
          const unreadCount = await prisma.message.count({
            where: {
              recipientId: currentUser.userId,
              status: { not: 'read' },
            },
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'unread_count', count: unreadCount })}\n\n`));
        } catch (error) {
          console.error('Failed to get unread count:', error);
        }

        // Heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (isConnected) {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          }
        }, 30000); // Every 30 seconds

        // Handle client disconnect
        req.signal.addEventListener('abort', () => {
          clearInterval(heartbeatInterval);
          isConnected = false;
          cleanupConnection(currentUser.userId, controller);
          controller.close();
        });
      },
      cancel() {
        isConnected = false;
        // Controller not available in cancel
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    return new Response('Error establishing connection', { status: 500 });
  }
}
