export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

const clubUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  county: z.enum([...KENYA_COUNTIES] as [string, ...string[]]).optional(),
  musicType: z.array(z.string()).optional(),
  dressCode: z.string().optional(),
  capacity: z.number().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')).optional(),
  tablePrice: z.number().min(0).optional(),
  boothPrice: z.number().min(0).optional(),
  generalPrice: z.number().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const club = await prisma.club.findUnique({
      where: { id: params.id },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== currentUser.userId && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validatedData = clubUpdateSchema.parse(body);

    const updatedClub = await prisma.club.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        musicType: validatedData.musicType ? JSON.stringify(validatedData.musicType) : undefined,
        capacity: validatedData.capacity ? Number(validatedData.capacity) : undefined,
      },
    });

    return NextResponse.json({ club: updatedClub });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Update club error:', error);
    return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const club = await prisma.club.findUnique({
      where: { id: params.id },
    });

    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    if (club.ownerId !== currentUser.userId && currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete
    await prisma.club.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Delete club error:', error);
    return NextResponse.json({ error: 'Failed to delete club' }, { status: 500 });
  }
}

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
