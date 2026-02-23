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
    const verified = searchParams.get('verified'); // 'true', 'false', 'all'

    const where: any = {};
    if (verified === 'true') where.isVerified = true;
    if (verified === 'false') where.isVerified = false;

    try {
        const clubs = await prisma.club.findMany({
            where,
            include: {
                owner: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ clubs });
    } catch (error) {
        console.error('Admin clubs error:', error);
        return NextResponse.json({ error: 'Failed to fetch clubs' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { clubId, action } = body; // 'approve', 'reject'

        if (!clubId || !action) {
            return NextResponse.json({ error: 'Missing clubId or action' }, { status: 400 });
        }

        let updateData: any = {};
        if (action === 'approve') {
            updateData = { isVerified: true, isActive: true };
        } else if (action === 'reject') {
            updateData = { isVerified: false, isActive: false };
        }

        const club = await prisma.club.update({
            where: { id: clubId },
            data: updateData
        });

        return NextResponse.json({ club });
    } catch (error) {
        console.error('Admin update club error:', error);
        return NextResponse.json({ error: 'Failed to update club' }, { status: 500 });
    }
}
