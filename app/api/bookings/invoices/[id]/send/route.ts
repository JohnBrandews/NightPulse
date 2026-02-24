export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendInvoiceEmail } from '@/lib/email';
import { generateInvoicePDF } from '@/lib/utils/invoice-pdf';

// Send invoice via email with PDF attachment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;

    // Get invoice with all details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: {
          include: {
            event: true,
          },
        },
        club: true,
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify authorization (admin or club owner)
    if (currentUser.role !== 'admin') {
      const club = await prisma.club.findFirst({
        where: { ownerId: currentUser.userId, id: invoice.clubId },
      });

      if (!club) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Check if user email exists
    if (!invoice.clientEmail) {
      return NextResponse.json({ error: 'Client email not available' }, { status: 400 });
    }

    // Determine if this is a receipt (paid) or invoice (pending)
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
        club: {
          name: invoice.club.name,
          address: invoice.club.address,
          phone: invoice.club.phone,
          email: invoice.club.email,
        },
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

    // Send email with PDF attachment
    const emailSent = await sendInvoiceEmail({
      to: invoice.clientEmail,
      clientName: invoice.clientName,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: currentTotal,
      dueDate: invoice.dueDate,
      clubName: invoice.club.name,
      isReceipt,
      pdfAttachment: {
        filename: `${isReceipt ? 'receipt' : 'invoice'}-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
      },
    });

    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Update invoice email tracking
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
      include: {
        booking: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: isReceipt ? 'Receipt sent successfully' : 'Invoice sent successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}
