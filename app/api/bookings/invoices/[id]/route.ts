export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { sendInvoiceEmail } from '@/lib/email';

const updateInvoiceSchema = z.object({
  status: z.enum(['pending', 'paid', 'overdraft']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'overdue']).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invoiceId = params.id;
    const body = await req.json();
    const validatedData = updateInvoiceSchema.parse(body);

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        booking: true,
        club: true,
        user: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify club belongs to current user
    const club = await prisma.club.findFirst({
      where: { ownerId: currentUser.userId, id: invoice.clubId },
    });

    if (!club) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if status changed to paid
    const statusChangedToPaid = validatedData.status === 'paid' && invoice.status !== 'paid';

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: validatedData.status,
        paymentStatus: validatedData.paymentStatus || (validatedData.status === 'paid' ? 'paid' : validatedData.status === 'overdraft' ? 'overdue' : undefined),
        notes: validatedData.notes,
      },
      include: {
        booking: {
          include: {
            user: true,
            club: true,
          },
        },
        club: true,
        user: true,
      },
    });

    // If status changed to paid, also update the booking
    if (statusChangedToPaid) {
      await prisma.booking.update({
        where: { id: invoice.bookingId },
        data: {
          status: 'completed',
          paymentStatus: 'paid',
        },
      });

      // Automatically send receipt email
      if (invoice.user.email) {
        await sendInvoiceEmail({
          to: invoice.user.email,
          clientName: invoice.clientName,
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          dueDate: invoice.dueDate,
          clubName: invoice.club.name,
          isReceipt: true,
        });

        // Update email tracking
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      invoice: updatedInvoice,
      receiptSent: statusChangedToPaid,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Update invoice error:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
