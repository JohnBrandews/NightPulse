export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

async function checkAdmin(req: NextRequest) {
    const currentUser = await getCurrentUser(req);
    return currentUser && currentUser.role === 'admin';
}

export async function GET(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');

    const where: any = {};
    if (clubId) where.clubId = clubId;

    try {
        const events = await prisma.event.findMany({
            where,
            include: {
                club: {
                    select: { name: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error('Admin events error:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
        return NextResponse.json({ error: 'Event ID required' }, { status: 400 });
    }

    try {
        await prisma.event.delete({
            where: { id: eventId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin delete event error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
