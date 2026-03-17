import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    // Try to get current user for audit logging (optional - logout should work even if token is invalid)
    const payload = await authenticateRequest(request);

    // Delete refresh token from database if present
    const cookieHeader = request.headers.get('Cookie');
    const refreshTokenMatch = cookieHeader?.match(/refresh_token=([^;]+)/);
    const refreshTokenValue = refreshTokenMatch ? refreshTokenMatch[1] : null;

    if (refreshTokenValue) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenValue },
      });
    }

    // Audit log
    if (payload) {
      const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
      await auditLog({
        userId: payload.userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: payload.userId,
        ip: ip || undefined,
      });
    }

    // Clear cookies
    const response = NextResponse.json({
      success: true,
      data: { message: 'Вы вышли из системы' },
    });

    response.cookies.set('access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (err) {
    return handleApiError(err);
  }
}
