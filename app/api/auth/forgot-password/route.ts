import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOTP, isValidEmail } from '@/lib/auth-helpers';
import { sendOTPEmail } from '@/lib/email-service';
import { handleAPIError, APIError } from '@/lib/api-error-handler';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email } = data;

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: true, message: 'If the email exists, an OTP has been sent' },
        { status: 200 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // For security, always return success message (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, an OTP has been sent',
      });
    }

    // Generate OTP
    const otp = generateOTP(5);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old OTPs for this email
    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    // Store new OTP
    await prisma.passwordReset.create({
      data: {
        email,
        otp,
        expiresAt,
      },
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);

    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({
      success: true,
      message: 'If the email exists, an OTP has been sent',
      ...(process.env.NODE_ENV === 'development' && { otp, emailSent }),
    });
  } catch (error) {
    return handleAPIError(error, 'POST /api/auth/forgot-password');
  }
}
