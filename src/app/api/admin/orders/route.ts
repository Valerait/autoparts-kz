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
    const status = searchParams.get('status') || undefined;
    const offset = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { status: status as any }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          items: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
              price: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    const mapped = orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    }));

    return paginated(mapped, total, page, limit);
  } catch (err) {
    return handleApiError(err);
  }
}
