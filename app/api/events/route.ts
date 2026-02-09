import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const eventSchema = z.object({
    clubId: z.string(),
    title: z.string().min(3),
    description: z.string().optional(),
    date: z.string(), // ISO string
    startTime: z.string(),
    endTime: z.string(),
    eventType: z.string(),
    coverCharge: z.number().nonnegative().optional(),
    dressCode: z.string().optional(),
    ageRestriction: z.number().int().min(18).optional(),
    needsDj: z.boolean().optional(),
    needsPromoter: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        // Club owner + Admin logic? Usually only club owners create events for their club.
        // Or promoters can create events for a club?
        // Let's stick to Club Owner for now.

        if (!currentUser || (currentUser.role !== 'club' && currentUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = eventSchema.parse(body);

        // Verify ownership of club if not admin
        if (currentUser.role !== 'admin') {
            const club = await prisma.club.findUnique({
                where: { id: validatedData.clubId },
            });
            if (!club || club.ownerId !== currentUser.userId) {
                return NextResponse.json({ error: 'Unauthorized to create event for this club' }, { status: 403 });
            }
        }

        const event = await prisma.event.create({
            data: {
                clubId: validatedData.clubId,
                title: validatedData.title,
                description: validatedData.description,
                date: new Date(validatedData.date),
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
                eventType: validatedData.eventType || 'regular',
                coverCharge: validatedData.coverCharge,
                dressCode: validatedData.dressCode,
                ageRestriction: validatedData.ageRestriction,
                needsDj: validatedData.needsDj || false,
                needsPromoter: validatedData.needsPromoter || false,
                isFeatured: validatedData.isFeatured || false,
                isActive: true, // Default active
            },
        });

        return NextResponse.json({ event }, { status: 201 });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Create event error:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
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

        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: { club: true }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const isOwner = event.club.ownerId === currentUser.userId;
        const isAdmin = currentUser.role === 'admin';

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Determine new status
        // Admin suspends (e.g. content violation). Owner cancels.
        const newStatus = isAdmin ? 'suspended' : 'cancelled';

        await prisma.event.update({
            where: { id: params.id },
            data: {
                isActive: false,
                status: newStatus
            }
        });

        return NextResponse.json({ message: `Event ${newStatus} successfully` });
    } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('clubId');
    const needsDj = searchParams.get('needsDj');
    const needsPromoter = searchParams.get('needsPromoter');
    const status = searchParams.get('status'); // 'active', 'completed', 'cancelled'
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};

    // Default: only active for public contexts
    if (!includeInactive) {
        where.isActive = true;
    }

    if (clubId) where.clubId = clubId;
    if (needsDj === 'true') where.needsDj = true;
    if (needsPromoter === 'true') where.needsPromoter = true;
    if (status) where.status = status;

    try {
        // Scope to owner's clubs if requester is a club owner (privacy)
        const currentUser = await getCurrentUser(req);
        if (currentUser && currentUser.role === 'club') {
            where.club = { ownerId: currentUser.userId };
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                club: {
                    select: { name: true, county: true, logo: true }
                }
            },
            orderBy: { date: 'asc' }
        });

        return NextResponse.json({ events });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
