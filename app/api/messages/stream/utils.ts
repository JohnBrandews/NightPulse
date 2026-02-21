// Store active SSE connections per user
export const userConnections = new Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>();

// Cleanup connection on close
export function cleanupConnection(userId: string, controller: ReadableStreamDefaultController<Uint8Array>) {
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(controller);
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }
}

// Function to broadcast new message to recipient
export async function broadcastMessage(recipientId: string, message: any) {
  const connections = userConnections.get(recipientId);
  if (connections) {
    const data = `data: ${JSON.stringify({ type: 'new_message', message })}\n\n`;
    Array.from(connections).forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch (error) {
        console.error('Failed to broadcast message:', error);
      }
    });
  }
}

// Function to broadcast message status update to sender
export async function broadcastStatusUpdate(userId: string, messageIds: string[], status: string) {
  const connections = userConnections.get(userId);
  if (connections) {
    const data = `data: ${JSON.stringify({ type: 'status_update', messageIds, status })}\n\n`;
    Array.from(connections).forEach((controller) => {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch (error) {
        console.error('Failed to broadcast status update:', error);
      }
    });
  }
}
