import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await prisma.club.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        events: {
          where: { isActive: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Parse JSON fields
    const clubWithParsedData = {
      ...club,
      musicType: club.musicType ? JSON.parse(club.musicType) : [],
      images: club.images ? JSON.parse(club.images) : [],
      openingHours: club.openingHours ? JSON.parse(club.openingHours) : {},
    };

    return NextResponse.json({ club: clubWithParsedData });
  } catch (error) {
    console.error('Get club error:', error);
    return NextResponse.json({ error: 'Failed to get club' }, { status: 500 });
  }
}
