import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Middleware to check admin status
async function checkAdmin(req: NextRequest) {
    const currentUser = await getCurrentUser(req);
    if (!currentUser || currentUser.role !== 'admin') {
        return false;
    }
    return true;
}

export async function GET(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status'); // 'pending', 'suspended'

    const where: any = {};

    if (role) where.role = role;

    if (status === 'suspended') {
        where.isActive = false;
    } else if (status === 'pending') {
        where.isVerified = false;
        where.role = { in: ['club', 'dj', 'promoter'] }; // Only these roles need verification
    }

    try {
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isVerified: true,
                isActive: true,
                profileImage: true,
                createdAt: true,
                // Include relevant profile info
                clubName: true,
                djName: true,
            }
        });

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Admin users error:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    if (!await checkAdmin(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, action } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
        }

        // Check if target user is admin
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });

        if (targetUser?.role === 'admin' && (action === 'suspend' || action === 'reject')) {
            return NextResponse.json({ error: 'Cannot suspend or reject an administrator account' }, { status: 403 });
        }

        let updateData: any = {};

        switch (action) {
            case 'approve':
                updateData = { isVerified: true, isActive: true, idVerificationStatus: 'approved' };
                break;
            case 'reject':
                updateData = { isVerified: false, isActive: false, idVerificationStatus: 'rejected' };
                break;
            case 'suspend':
                updateData = { isActive: false };
                break;
            case 'unsuspend':
                updateData = { isActive: true };
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Admin user update error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
