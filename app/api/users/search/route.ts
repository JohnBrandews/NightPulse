export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const county = searchParams.get('county');
    const lookingFor = searchParams.get('lookingFor');
    const gender = searchParams.get('gender');
    const verified = searchParams.get('verified');

    const where: any = {
      role: 'user',
      isActive: true,
      id: { not: currentUser.userId }, // Exclude current user
    };

    if (county) {
      where.county = county;
    }
    if (lookingFor) {
      where.lookingFor = lookingFor;
    }
    if (gender) {
      where.gender = gender;
    }
    if (verified === 'true') {
      where.isVerified = true;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        gender: true,
        lookingFor: true,
        county: true,
        bio: true,
        profileImage: true,
        isVerified: true,
        age: true,
      },
      take: 50,
      orderBy: [
        { isVerified: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
