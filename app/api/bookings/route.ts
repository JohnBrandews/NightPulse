import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const bookingSchema = z.object({
  club: z.string(),
  event: z.string().optional(),
  bookingType: z.enum(['table', 'booth', 'general', 'dj_gig']),
  date: z.string(),
  time: z.string(),
  numberOfGuests: z.number().min(1),
  specialRequests: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = bookingSchema.parse(body);

    const booking = await prisma.booking.create({
      data: {
        userId: currentUser.userId,
        clubId: validatedData.club,
        eventId: validatedData.event,
        bookingType: validatedData.bookingType,
        date: new Date(validatedData.date),
        time: validatedData.time,
        numberOfGuests: validatedData.numberOfGuests,
        specialRequests: validatedData.specialRequests,
        status: 'pending',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            county: true,
            images: true,
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

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = currentUser.role;

    let bookings;
    if (role === 'club' || role === 'admin') {
      // Clubs see bookings for their clubs
      const clubId = searchParams.get('clubId');
      const where: any = clubId ? { clubId } : {};
      
      bookings = await prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
              county: true,
              images: true,
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
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Users see their own bookings
      bookings = await prisma.booking.findMany({
        where: { userId: currentUser.userId },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              county: true,
              images: true,
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
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Get bookings error:', error);
    return NextResponse.json({ error: 'Failed to get bookings' }, { status: 500 });
  }
}
