import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { paginated, handleApiError } from '@/lib/api-response';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const role = searchParams.get('role') || undefined;
    const offset = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as any }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          provider: true,
          phoneVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { orders: true, favorites: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginated(users, total, page, limit);
  } catch (err) {
    return handleApiError(err);
  }
}
