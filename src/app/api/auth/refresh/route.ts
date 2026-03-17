import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JwtPayload } from '@/lib/auth';
import { error, unauthorized, handleApiError } from '@/lib/api-response';

export async function POST(request: Request) {
  try {
    // Get refresh token from cookie
    const cookieHeader = request.headers.get('Cookie');
    const refreshTokenMatch = cookieHeader?.match(/refresh_token=([^;]+)/);
    const refreshTokenValue = refreshTokenMatch ? refreshTokenMatch[1] : null;

    if (!refreshTokenValue) {
      return unauthorized('Refresh token отсутствует');
    }

    // Verify the JWT signature
    const payload = await verifyRefreshToken(refreshTokenValue);
    if (!payload) {
      return unauthorized('Недействительный refresh token');
    }

    // Check that the token exists in the database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      // Clean up expired token if it exists
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      return unauthorized('Refresh token истёк или отозван');
    }

    // Verify the user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
    });

    if (!user) {
      // Delete the token since the user no longer exists
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      return unauthorized('Пользователь не найден');
    }

    // Delete the old refresh token (rotation)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Issue new token pair
    const newPayload: JwtPayload = {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    };

    const newAccessToken = await signAccessToken(newPayload);
    const newRefreshToken = await signRefreshToken(newPayload);

    // Save new refresh token
    const refreshExpiresMs = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + refreshExpiresMs),
      },
    });

    // Set cookies
    const response = NextResponse.json({
      success: true,
      data: { message: 'Токены обновлены' },
    });

    response.cookies.set('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60,
    });

    response.cookies.set('refresh_token', newRefreshToken, {
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
