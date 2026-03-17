import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, type JwtPayload } from '@/lib/auth';
import { error, handleApiError, validationError } from '@/lib/api-response';
import { loginSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { phone, password } = parsed.data;

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user || !user.isActive) {
      return error('Неверный номер телефона или пароль', 401);
    }

    if (!user.passwordHash) {
      return error('Для этого аккаунта используется вход через WhatsApp', 400);
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return error('Неверный номер телефона или пароль', 401);
    }

    // Generate tokens
    const tokenPayload: JwtPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = await signRefreshToken(tokenPayload);

    // Save refresh token to database
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
      action: 'LOGIN',
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
