export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Update user's online status (heartbeat)
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: currentUser.userId },
      data: {
        isOnline: true,
        lastActive: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Online status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// Get online status of users
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userIds = searchParams.get('ids')?.split(',') || [];

    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        isOnline: true,
        lastActive: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get online status error:', error);
    return NextResponse.json({ error: 'Failed to get online status' }, { status: 500 });
  }
}
