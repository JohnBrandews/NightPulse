import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get club owned by current user
    const club = await prisma.club.findFirst({
      where: { ownerId: currentUser.userId },
    });

    if (!club) {
      return NextResponse.json({ error: 'No club found' }, { status: 404 });
    }

    // Get all invoices for this club
    const invoices = await prisma.invoice.findMany({
      where: { clubId: club.id },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                profileImage: true,
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
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error('Get invoices error:', error);
    return NextResponse.json({ error: 'Failed to get invoices' }, { status: 500 });
  }
}
