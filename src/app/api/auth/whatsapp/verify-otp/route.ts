import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, type JwtPayload } from '@/lib/auth';
import { error, handleApiError, validationError } from '@/lib/api-response';
import { whatsappVerifyOtpSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';
import { verifyOtp } from '@/services/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = whatsappVerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { phone, code } = parsed.data;

    // Verify OTP code
    const otpResult = await verifyOtp(phone, code);
    if (!otpResult.valid) {
      return error(otpResult.error || 'Неверный код', 400);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    let isNewUser = false;

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          provider: 'WHATSAPP',
          phoneVerified: true,
        },
      });
      isNewUser = true;
    } else {
      // Update phone verification status if not already verified
      if (!user.phoneVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }
    }

    if (!user.isActive) {
      return error('Аккаунт деактивирован', 403);
    }

    // Generate tokens
    const tokenPayload: JwtPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // Save refresh token
    const refreshExpiresMs = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    // Audit log
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    await auditLog({
      userId: user.id,
      action: isNewUser ? 'REGISTER_WHATSAPP' : 'LOGIN_WHATSAPP',
      entity: 'User',
      entityId: user.id,
      ip: ip || undefined,
    });

    // Set cookies
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role,
          phoneVerified: user.phoneVerified,
        },
        isNewUser,
      },
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1]);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}
