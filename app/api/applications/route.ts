export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';

const updateApplicationSchema = z.object({
    status: z.enum(['pending', 'accepted', 'rejected']),
});

const createApplicationSchema = z.object({
    eventId: z.string().optional().nullable(),
    gigId: z.string().optional().nullable(),
    message: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(1, "Phone is required"),
    salaryExpectation: z.string().optional(),
    musicLinks: z.union([z.string(), z.array(z.string())]).optional().nullable(),
});

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only DJ or Promoter can apply
        if (currentUser.role !== 'dj' && currentUser.role !== 'promoter') {
            return NextResponse.json({ error: 'Only DJs and Promoters can apply' }, { status: 403 });
        }

        const body = await req.json();
        const validatedData = createApplicationSchema.parse(body);

        if (!validatedData.eventId && !validatedData.gigId) {
            return NextResponse.json({ error: 'Must apply to an Event or Gig' }, { status: 400 });
        }

        // Check for existing application
        const existingApplication = await prisma.application.findFirst({
            where: {
                applicantId: currentUser.userId,
                OR: [
                    { eventId: validatedData.eventId || undefined },
                    { gigId: validatedData.gigId || undefined }
                ]
            }
        });

        if (existingApplication) {
            return NextResponse.json({ error: 'You have already applied for this position' }, { status: 409 });
        }

        // Handle musicLinks serialization
        const musicLinksStr = Array.isArray(validatedData.musicLinks)
            ? JSON.stringify(validatedData.musicLinks)
            : validatedData.musicLinks;

        const application = await prisma.application.create({
            data: {
                applicantId: currentUser.userId,
                eventId: validatedData.eventId || null,
                gigId: validatedData.gigId || null,
                message: validatedData.message || '',
                status: 'pending',
                name: validatedData.name,
                email: validatedData.email,
                phone: validatedData.phone,
                salaryExpectation: validatedData.salaryExpectation,
                musicLinks: musicLinksStr,
            },
            include: {
                event: { include: { club: true } },
                gig: { include: { club: true } }
            }
        });

        // Notify Club Owner
        const clubOwnerId = application.event?.club.ownerId || application.gig?.club.ownerId;
        if (clubOwnerId) {
            await createNotification({
                recipientId: clubOwnerId,
                senderId: currentUser.userId,
                type: 'application_update', // Or maybe a new type 'new_application'
                content: `New application from ${(currentUser as any).name} for ${application.event?.title || application.gig?.title}`,
                relatedClubId: application.event?.clubId || application.gig?.clubId,
                relatedEventId: application.eventId || undefined,
            });
        }

        return NextResponse.json({ application }, { status: 201 });
    } catch (error) {
        console.error('Application error:', error);
        return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    // Update status (Accept/Reject) - usually by Club Owner
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser || (currentUser.role !== 'club' && currentUser.role !== 'admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body; // Expecting application ID and new status

        const validatedData = updateApplicationSchema.safeParse({ status });

        if (!validatedData.success) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const application = await prisma.application.findUnique({
            where: { id },
            include: {
                event: { include: { club: true } },
                gig: { include: { club: true } }
            }
        });

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        // Verify ownership
        const clubOwnerId = application.event?.club.ownerId || application.gig?.club.ownerId;
        if (currentUser.role !== 'admin' && clubOwnerId !== currentUser.userId) {
            return NextResponse.json({ error: 'Unauthorized to update this application' }, { status: 403 });
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { status: validatedData.data.status }
        });

        // Notify Applicant
        if (application.status !== validatedData.data.status) {
            await createNotification({
                recipientId: application.applicantId,
                senderId: currentUser.userId,
                type: 'application_update',
                content: `Your application for ${application.event?.title || application.gig?.title} has been ${validatedData.data.status}.`,
                relatedClubId: application.event?.clubId || application.gig?.clubId,
                relatedEventId: application.eventId || undefined,
            });
        }

        return NextResponse.json({ application: updatedApplication });

    } catch (error) {
        console.error('Update application error:', error);
        return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // Get applications for:
    // 1. Current user (My Applications)
    // 2. Club Owner (Applications for my events)

    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const view = searchParams.get('view'); // 'my_applications' | 'received'

        if (view === 'received') {
            // Find events owned by this user's clubs
            // Logic: Fetch all applications where event.club.ownerId = userId

            // Prisma doesn't support deep filtering easily in one go for "OR" conditions across relations efficiently sometimes,
            // but let's try.
            const applications = await prisma.application.findMany({
                where: {
                    OR: [
                        {
                            event: {
                                club: { ownerId: currentUser.userId }
                            }
                        },
                        {
                            gig: {
                                club: { ownerId: currentUser.userId }
                            }
                        }
                    ]
                },
                include: {
                    applicant: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            profileImage: true,
                            county: true,
                            bio: true,
                            isVerified: true,
                            djName: true,
                            djMusicLinks: true
                        }
                    },
                    event: { select: { id: true, title: true, date: true } },
                    gig: { select: { id: true, title: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ applications });
        } else {
            // Default: My Applications (as applicant)
            const applications = await prisma.application.findMany({
                where: { applicantId: currentUser.userId },
                include: {
                    event: {
                        include: { club: { select: { name: true } } }
                    },
                    gig: {
                        include: { club: { select: { name: true } } }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
            return NextResponse.json({ applications });
        }

    } catch (error) {
        console.error('Get applications error:', error);
        return NextResponse.json({ error: 'Failed to get applications' }, { status: 500 });
    }
}
