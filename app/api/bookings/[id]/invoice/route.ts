export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Create invoice from booking
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Get booking with user and club details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        event: {
          select: {
            id: true,
            title: true,
            date: true,
            coverCharge: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if invoice already exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { bookingId: bookingId },
    });

    if (existingInvoice) {
      return NextResponse.json({ error: 'Invoice already exists for this booking', invoice: existingInvoice }, { status: 400 });
    }

    // Verify authorization
    if (currentUser.role !== 'admin') {
      const club = await prisma.club.findFirst({
        where: { ownerId: currentUser.userId, id: booking.clubId },
      });

      if (!club) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Use the existing club ID or find it if admin
    const targetClubId = booking.clubId;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${bookingId.slice(-6).toUpperCase()}`;

    // Calculate amounts:
    //   - If booking is for an event: subtotal = event.coverCharge × numberOfGuests
    //   - If no event or no cover charge: fall back to booking.totalAmount (flat fee set during booking)
    const pricePerGuest = booking.event?.coverCharge ?? 0;
    const isPerGuest = pricePerGuest > 0;
    const subtotal = isPerGuest
      ? pricePerGuest * booking.numberOfGuests
      : (booking.totalAmount ?? 0);

    const TAX_RATE = 0.015; // 1.5% VAT
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const totalAmount = parseFloat((subtotal + tax).toFixed(2));

    let invoiceNotes = `Invoice for ${booking.bookingType.toUpperCase()} reservation`;
    if (booking.event) {
      invoiceNotes += ` at ${booking.event.title}`;
    }

    if (isPerGuest) {
      invoiceNotes += ` (${booking.numberOfGuests} guest${booking.numberOfGuests > 1 ? 's' : ''} @ KES ${pricePerGuest} each)`;
    } else {
      invoiceNotes += ` (Flat Fee: KES ${subtotal})`;
    }

    // Set due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: booking.id,
        clubId: targetClubId,
        userId: booking.userId,
        invoiceNumber,
        clientName: booking.user.name,
        clientEmail: booking.user.email,
        clientPhone: booking.user.phone || undefined,
        issueDate: new Date(),
        dueDate,
        subtotal,
        tax,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        notes: invoiceNotes,
      },
      include: {
        booking: {
          include: {
            user: true,
            club: true,
          },
        },
      },
    });

    // Write the computed total back to the booking record for consistency
    await prisma.booking.update({
      where: { id: booking.id },
      data: { totalAmount },
    });

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
