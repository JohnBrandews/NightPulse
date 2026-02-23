import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

const clubSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  county: z.enum([...KENYA_COUNTIES] as [string, ...string[]]),
  musicType: z.array(z.string()),
  dressCode: z.string(),
  capacity: z.number().min(1),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  tablePrice: z.number().min(0).optional().default(0),
  boothPrice: z.number().min(0).optional().default(0),
  generalPrice: z.number().min(0).optional().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || (currentUser.role !== 'club' && currentUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = clubSchema.parse(body);

    const club = await prisma.club.create({
      data: {
        ownerId: currentUser.userId,
        name: validatedData.name,
        address: validatedData.address,
        county: validatedData.county,
        musicType: JSON.stringify(validatedData.musicType),
        dressCode: validatedData.dressCode,
        capacity: validatedData.capacity,
        description: validatedData.description,
        website: validatedData.website || null,
        phone: validatedData.phone || null,
        email: validatedData.email || null,
        tablePrice: validatedData.tablePrice,
        boothPrice: validatedData.boothPrice,
        generalPrice: validatedData.generalPrice,
        isVerified: false, // Requires admin approval
      },
    });

    return NextResponse.json({ club }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Create club error:', error);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const county = searchParams.get('county');
    const musicType = searchParams.get('musicType');
    const verified = searchParams.get('verified');

    const where: any = { isActive: true };

    // If fetching my clubs, allow seeing inactive/unverified ones?
    // Let's check auth
    const currentUser = await getCurrentUser(req);

    if (owner === 'me') {
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      where.ownerId = currentUser.userId;
      // Default to active clubs only, even for 'me'
      where.isActive = true;
    }

    if (county) {
      where.county = county;
    }

    if (musicType) {
      where.musicType = {
        contains: musicType,
      };
    }

    if (verified === 'true') {
      where.isVerified = true;
    } else if (owner === 'me') {
      // If owner is me, don't enforce verified=true unless asked
    } else {
      // For public listing, maybe default to verified? 
      // The existing code didn't force verified=true unless asked, but discovered page asks for it.
    }

    const clubs = await prisma.club.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { isVerified: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Parse JSON fields
    const clubsWithParsedData = clubs.map(club => ({
      ...club,
      musicType: club.musicType ? JSON.parse(club.musicType) : [],
      images: club.images ? JSON.parse(club.images) : [],
      openingHours: club.openingHours ? JSON.parse(club.openingHours) : {},
    }));

    return NextResponse.json({ clubs: clubsWithParsedData });
  } catch (error) {
    console.error('Get clubs error:', error);
    return NextResponse.json({ error: 'Failed to get clubs' }, { status: 500 });
  }
}
