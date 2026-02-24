export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        gender: true,
        lookingFor: true,
        county: true,
        bio: true,
        profileImage: true,
        isVerified: true,
        isActive: true,
        ageVerified: true,
        idVerificationStatus: true,
        clubName: true,
        djName: true,
        djGenre: true,
        djMusicLinks: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const userWithParsedData = {
      ...user,
      djGenre: user.djGenre ? JSON.parse(user.djGenre) : [],
      djMusicLinks: user.djMusicLinks ? JSON.parse(user.djMusicLinks) : [],
    };

    return NextResponse.json({ user: userWithParsedData });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
