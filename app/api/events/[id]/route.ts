import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const updateEventSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    eventType: z.string().optional(),
    coverCharge: z.number().nonnegative().optional(),
    dressCode: z.string().optional(),
    ageRestriction: z.number().int().min(18).optional(),
    needsDj: z.boolean().optional(),
    needsPromoter: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    status: z.enum(['active', 'cancelled', 'completed']).optional(),
    isActive: z.boolean().optional(), // For soft delete/archive
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: {
                club: {
                    select: {
                        id: true,
                        name: true,
                        county: true,
                        images: true,
                        logo: true,
                    }
                },
                bookings: {
                    select: { status: true } // Just summary maybe? Or allow detailed if owner.
                }
            }
        });

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        return NextResponse.json({ event });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || (currentUser.role !== 'club' && currentUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const existingEvent = await prisma.event.findUnique({
            where: { id },
            include: { club: true }
        });

        if (!existingEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        // Verify ownership for non-admins
        const isAdmin = currentUser.role === 'admin';
        const isOwner = existingEvent.club.ownerId === currentUser.userId;
        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Unauthorized to update this event' }, { status: 403 });
        }

        const body = await req.json();

        // Support action-based status toggles: suspend | unsuspend | cancel | reinstate
        const action = body?.action as string | undefined;
        if (action) {
            let data: any = {};
            switch (action) {
                case 'suspend':
                    if (!isAdmin) return NextResponse.json({ error: 'Only admin can suspend' }, { status: 403 });
                    data = { isActive: false, status: 'suspended' };
                    break;
                case 'unsuspend':
                    if (!isAdmin) return NextResponse.json({ error: 'Only admin can unsuspend' }, { status: 403 });
                    data = { isActive: true, status: 'active' };
                    break;
                case 'cancel':
                    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                    data = { isActive: false, status: 'cancelled' };
                    break;
                case 'reinstate':
                    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                    data = { isActive: true, status: 'active' };
                    break;
                default:
                    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }

            const updated = await prisma.event.update({ where: { id }, data });
            return NextResponse.json({ event: updated });
        }

        // Fallback to field updates with validation
        const validatedData = updateEventSchema.parse(body);
        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                ...validatedData,
                ...(validatedData.date ? { date: new Date(validatedData.date) } : {}),
            }
        });
        return NextResponse.json({ event: updatedEvent });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
        }
        console.error('Update event error:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    // Soft delete usually better, but allow DELETE if really needed or just mark inactive
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || (currentUser.role !== 'club' && currentUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const existingEvent = await prisma.event.findUnique({
            where: { id },
            include: { club: true }
        });

        if (!existingEvent) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (currentUser.role !== 'admin' && existingEvent.club.ownerId !== currentUser.userId) {
            return NextResponse.json({ error: 'Unauthorized to delete this event' }, { status: 403 });
        }

        // Soft delete: setup isActive = false
        const deletedEvent = await prisma.event.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ message: 'Event removed', event: deletedEvent });

    } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
