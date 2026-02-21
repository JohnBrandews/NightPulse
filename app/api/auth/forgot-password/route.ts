import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import crypto from 'crypto';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = forgotPasswordSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // For security reasons, don't reveal that the user doesn't exist
            // But the user specifically asked: "if the email doesn't exist he will be told create an account first"
            // So I will follow the user's request.
            return NextResponse.json(
                { error: 'Email not found. Please create an account first.' },
                { status: 404 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        // Save token to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Send email
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        await sendPasswordResetEmail({
            to: user.email,
            clientName: user.name,
            resetLink,
        });

        return NextResponse.json({
            message: 'Password reset link sent to your email',
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
