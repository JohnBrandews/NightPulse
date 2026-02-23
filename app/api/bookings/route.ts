export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const bookingSchema = z.object({
  club: z.string(),
  event: z.string().optional(),
  bookingType: z.enum(['table', 'booth', 'general', 'dj_gig']).default('general'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  numberOfGuests: z.preprocess((v) => (typeof v === 'string' ? parseInt(v, 10) : v), z.number().int().min(1, 'At least 1 guest')),
  specialRequests: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Received booking request:', body);

    const validatedData = bookingSchema.parse(body);
    console.log('Validated booking data:', validatedData);

    // Validate club exists
    const club = await prisma.club.findUnique({ where: { id: validatedData.club } });
    if (!club) {
      return NextResponse.json({ error: 'Invalid club selected' }, { status: 400 });
    }

    // If event specified, validate it exists and is active
    let eventId: string | undefined = undefined;
    if (validatedData.event) {
      const ev = await prisma.event.findUnique({ where: { id: validatedData.event } });
      if (!ev || !ev.isActive) {
        return NextResponse.json({ error: 'Selected event is not available' }, { status: 400 });
      }
      eventId = ev.id;
    }

    // Normalize date input
    const dateStr = validatedData.date;
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Calculate initial price
    let totalAmount = 0;

    // 1. Try Event Price (Per Guest)
    if (eventId) {
      const ev = await prisma.event.findUnique({ where: { id: eventId } });
      if (ev?.coverCharge) {
        totalAmount = ev.coverCharge * validatedData.numberOfGuests;
      }
    }

    // 2. Fallback to Club Flat Pricing (Per Unit/Type) if no event price
    if (totalAmount === 0) {
      if (validatedData.bookingType === 'table') {
        totalAmount = club.tablePrice || 0;
      } else if (validatedData.bookingType === 'booth') {
        totalAmount = club.boothPrice || 0;
      } else if (validatedData.bookingType === 'general') {
        totalAmount = club.generalPrice || 0;
      }
    }

    const booking = await prisma.booking.create({
      data: {
        userId: currentUser.userId,
        clubId: validatedData.club,
        eventId: eventId,
        bookingType: validatedData.bookingType,
        date: parsedDate,
        time: validatedData.time,
        numberOfGuests: validatedData.numberOfGuests,
        specialRequests: validatedData.specialRequests,
        status: 'pending',
        totalAmount: totalAmount > 0 ? totalAmount : undefined,
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
    console.error('SERVER SIDE BOOKING ERROR:', error);
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
      // Clubs see bookings for their clubs (scoped to their ownership)
      const clubId = searchParams.get('clubId');
      const where: any = {};

      if (role === 'club') {
        // Scope to clubs owned by current user
        where.club = { ownerId: currentUser.userId };
        if (clubId) {
          where.clubId = clubId;
        }
      } else if (role === 'admin') {
        if (clubId) where.clubId = clubId;
      }

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
          invoice: true,
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
          invoice: true,
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
