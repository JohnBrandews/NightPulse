import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = currentUser.role;
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');

    const where: any = {};

    if (role === 'admin') {
      if (clubId) where.clubId = clubId;
    } else if (role === 'club') {
      // Get all clubs owned by current user
      const clubs = await prisma.club.findMany({
        where: { ownerId: currentUser.userId },
        select: { id: true },
      });

      if (clubs.length === 0) {
        return NextResponse.json({ invoices: [] });
      }

      const clubIds = clubs.map(c => c.id);

      if (clubId && clubIds.includes(clubId)) {
        where.clubId = clubId;
      } else {
        where.clubId = { in: clubIds };
      }
    } else {
      // Regular users see their own invoices
      where.userId = currentUser.userId;
    }

    // Get all invoices based on filter
    const invoices = await prisma.invoice.findMany({
      where,
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
