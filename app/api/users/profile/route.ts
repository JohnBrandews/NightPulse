export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    profileImage: z.string().url().optional().or(z.literal('')), // URL or empty string
    djGenre: z.array(z.string()).optional(),
    djMusicLinks: z.array(z.string()).optional(),
    salaryExpectation: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser(req);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const validatedData = updateProfileSchema.parse(body);

        const updatedUser = await prisma.user.update({
            where: { id: currentUser.userId },
            data: {
                name: validatedData.name,
                bio: validatedData.bio,
                phone: validatedData.phone,
                profileImage: validatedData.profileImage,
                djGenre: validatedData.djGenre ? JSON.stringify(validatedData.djGenre) : undefined,
                djMusicLinks: validatedData.djMusicLinks ? JSON.stringify(validatedData.djMusicLinks) : undefined,
            },
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation error', details: error.errors },
                { status: 400 }
            );
        }
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
