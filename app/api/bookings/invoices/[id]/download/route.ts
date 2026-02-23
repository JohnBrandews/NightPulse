export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/utils/invoice-pdf';

// Download invoice/receipt as PDF
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          include: {
            event: true,
          },
        },
        club: {
          select: {
            name: true,
            address: true,
            phone: true,
            email: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify access (admin, club owner, or invoice owner)
    if (currentUser.role !== 'admin' && currentUser.userId !== invoice.userId) {
      const club = await prisma.club.findFirst({
        where: { ownerId: currentUser.userId, id: invoice.clubId },
      });

      if (!club) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const isReceipt = invoice.status === 'paid';

    // REPAIR LOGIC: If invoice has 0 amount, try to recalculate it from the booking/event
    let currentSubtotal = invoice.subtotal;
    let currentTax = invoice.tax;
    let currentTotal = invoice.totalAmount;

    if (currentTotal === 0) {
      const pricePerGuest = invoice.booking.event?.coverCharge ?? 0;
      currentSubtotal = pricePerGuest > 0
        ? pricePerGuest * invoice.booking.numberOfGuests
        : (invoice.booking.totalAmount ?? 0);

      const TAX_RATE = 0.015; // 1.5% VAT
      currentTax = parseFloat((currentSubtotal * TAX_RATE).toFixed(2));
      currentTotal = parseFloat((currentSubtotal + currentTax).toFixed(2));

      // If we managed to calculate a non-zero amount, update it in DB
      if (currentTotal > 0) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            subtotal: currentSubtotal,
            tax: currentTax,
            totalAmount: currentTotal,
          }
        });

        // Also update booking records for consistency
        await prisma.booking.update({
          where: { id: invoice.bookingId },
          data: { totalAmount: currentTotal }
        });
      }
    }

    // Generate PDF buffer using @react-pdf/renderer (webpack-safe, no native deps)
    const pdfBuffer = await generateInvoicePDF(
      {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: invoice.status,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientPhone: invoice.clientPhone,
        subtotal: currentSubtotal,
        tax: currentTax,
        totalAmount: currentTotal,
        notes: invoice.notes,
        club: invoice.club,
        booking: {
          bookingType: invoice.booking.bookingType,
          date: invoice.booking.date,
          time: invoice.booking.time,
          numberOfGuests: invoice.booking.numberOfGuests,
          event: invoice.booking.event ? { title: invoice.booking.event.title } : null,
        },
      },
      isReceipt
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${isReceipt ? 'receipt' : 'invoice'}-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error('Download invoice error:', error);
    return NextResponse.json({ error: 'Failed to download invoice' }, { status: 500 });
  }
}
