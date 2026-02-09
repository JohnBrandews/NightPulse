import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, generateToken } from '@/lib/auth';
import { isAgeValidForFemale, validateDateOfBirth } from '@/lib/utils/ageVerification';
import { z } from 'zod';
import { KENYA_COUNTIES } from '@/lib/kenya-counties';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['user', 'club', 'promoter', 'dj']),
  gender: z.enum(['male', 'female', 'other']).optional(),
  lookingFor: z.enum(['men', 'women', 'both']).optional(),
  dateOfBirth: z.string().optional(),
  county: z.string().min(1, 'County is required'),
}).superRefine((data, ctx) => {
  // For user role, require gender, lookingFor, and dateOfBirth
  if (data.role === 'user') {
    if (!data.gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Gender is required for regular users',
        path: ['gender'],
      });
    }
    if (!data.lookingFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Looking for is required for regular users',
        path: ['lookingFor'],
      });
    }
    if (!data.dateOfBirth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Date of birth is required for regular users',
        path: ['dateOfBirth'],
      });
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Clean up empty strings
    if (body.gender === '') body.gender = undefined;
    if (body.lookingFor === '') body.lookingFor = undefined;
    if (body.dateOfBirth === '') body.dateOfBirth = undefined;

    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Validate county
    if (!validatedData.county || !KENYA_COUNTIES.includes(validatedData.county as any)) {
      return NextResponse.json(
        { error: 'Invalid county. Please select a valid Kenya county.' },
        { status: 400 }
      );
    }

    // Clean up empty strings for optional fields


    // Age verification for female users
    let ageVerified = false;
    let idVerificationStatus: 'pending' | 'approved' | 'rejected' | 'not_required' = 'not_required';
    let age: number | undefined;

    if (validatedData.gender === 'female' && validatedData.dateOfBirth) {
      const dob = new Date(validatedData.dateOfBirth);
      const ageValidation = validateDateOfBirth(dob);

      if (!ageValidation.valid) {
        return NextResponse.json(
          { error: ageValidation.error },
          { status: 400 }
        );
      }

      if (!isAgeValidForFemale(dob)) {
        return NextResponse.json(
          { error: 'Ladies must be at least 20 years old to register' },
          { status: 400 }
        );
      }

      age = new Date().getFullYear() - dob.getFullYear();
      const monthDiff = new Date().getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < dob.getDate())) {
        age--;
      }

      ageVerified = true;
      idVerificationStatus = 'pending'; // Requires ID upload
    } else if (validatedData.dateOfBirth) {
      const dob = new Date(validatedData.dateOfBirth);
      age = new Date().getFullYear() - dob.getFullYear();
      const monthDiff = new Date().getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < dob.getDate())) {
        age--;
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        role: validatedData.role,
        gender: validatedData.gender,
        lookingFor: validatedData.lookingFor,
        county: validatedData.county,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        age,
        ageVerified,
        idVerificationStatus,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      console.error('Validation error details:', error.errors);
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', message: error.message },
      { status: 500 }
    );
  }
}
