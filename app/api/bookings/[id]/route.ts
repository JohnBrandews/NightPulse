export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod'; // Import z from zod
import { createNotification } from '@/lib/notifications';

const updateBookingSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'rejected', 'cancelled', 'completed']),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']).optional(),
  tableNumber: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(req);
    // User can cancel own booking
    // Club owner/Admin can update status

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { club: true, user: true, event: true } // Include event for notification context
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const body = await req.json();
    const validatedData = updateBookingSchema.parse(body);

    // Permission check
    let isAuthorized = false;
    let isClubOwner = false;

    if (currentUser.role === 'admin') {
      isAuthorized = true;
    } else if (currentUser.userId === booking.userId) {
      // User can only cancel
      if (validatedData.status === 'cancelled') {
        isAuthorized = true;
      }
    } else if (currentUser.userId === booking.club.ownerId) {
      isAuthorized = true;
      isClubOwner = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized to update this booking' }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: validatedData.status,
        paymentStatus: validatedData.paymentStatus,
        tableNumber: validatedData.tableNumber,
      }
    });

    // Send notification if status changed and it was done by club/admin targeting the user
    // or if user cancelled targeting the club?
    if (booking.status !== validatedData.status) {
      if (isClubOwner || currentUser.role === 'admin') {
        // Notify User
        await createNotification({
          recipientId: booking.userId,
          senderId: currentUser.userId,
          type: 'booking_update',
          content: `Your booking at ${booking.club.name} has been ${validatedData.status}.`,
          relatedClubId: booking.clubId,
          relatedEventId: booking.eventId || undefined,
        });
      }
      // If user cancelled, maybe notify club owner?
      if (currentUser.userId === booking.userId && validatedData.status === 'cancelled') {
        await createNotification({
          recipientId: booking.club.ownerId,
          senderId: currentUser.userId,
          type: 'booking_update',
          content: `Booking by ${booking.user.name} has been cancelled.`,
          relatedClubId: booking.clubId,
          relatedEventId: booking.eventId || undefined,
        });
      }
    }

    return NextResponse.json({ booking: updatedBooking });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
