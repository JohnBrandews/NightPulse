import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        role: true,
        gender: true,
        lookingFor: true,
        county: true,
        bio: true,
        profileImage: true,
        images: true,
        isVerified: true,
        age: true,
        djName: true,
        djGenre: true,
        djBio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse JSON fields
    const userWithParsedData = {
      ...user,
      images: user.images ? JSON.parse(user.images) : [],
      djGenre: user.djGenre ? JSON.parse(user.djGenre) : [],
    };

    return NextResponse.json({ user: userWithParsedData });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
