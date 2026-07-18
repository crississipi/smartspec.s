import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email, otp, password } = data;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Verify OTP still valid
    if (otp) {
      const passwordReset = await prisma.passwordReset.findFirst({
        where: {
          email,
          otp: otp.toString(),
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!passwordReset) {
        return NextResponse.json(
          { success: false, message: 'Invalid or expired OTP' },
          { status: 400 }
        );
      }

      // Delete used OTP
      await prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
