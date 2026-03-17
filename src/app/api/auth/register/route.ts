import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, type JwtPayload } from '@/lib/auth';
import { success, error, handleApiError, validationError } from '@/lib/api-response';
import { registerSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { phone, password, name } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return error('Пользователь с таким номером уже зарегистрирован', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        name,
        provider: 'LOCAL',
      },
    });

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
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      ip: ip || undefined,
    });

    // Set cookies
    const response = NextResponse.json(
      {
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
      },
      { status: 201 }
    );

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60, // 15 minutes
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const value = parseInt(match[1]);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}
