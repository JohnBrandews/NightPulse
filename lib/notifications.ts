import prisma from '@/lib/db';

export async function createNotification({
    recipientId,
    senderId, // System notifications might come from a specific user (e.g. club owner) or a system user if we had one.
    content,
    type,
    relatedClubId,
    relatedEventId,
}: {
    recipientId: string;
    senderId: string;
    content: string;
    type: 'message' | 'club_invite' | 'application_update' | 'booking_update';
    relatedClubId?: string;
    relatedEventId?: string;
}) {
    try {
        const notification = await prisma.message.create({
            data: {
                recipientId,
                senderId,
                content,
                type,
                relatedClubId,
                relatedEventId,
                status: 'sent',
            },
        });
        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
        // don't throw, we don't want to break the main flow if notification fails
        return null;
    }
}
