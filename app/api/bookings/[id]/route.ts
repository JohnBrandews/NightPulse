import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });
    
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only clubs can update booking status
    if (currentUser.role !== 'club' && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, tableNumber } = body;

    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(tableNumber && { tableNumber }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            county: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
          },
        },
      },
    });

    return NextResponse.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}
