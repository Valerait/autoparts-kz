import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      ordersByStatus,
      recentOrders,
      revenueResult,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
              price: true,
            },
          },
          user: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const statusCounts = ordersByStatus.reduce(
      (acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    return success({
      totalProducts,
      totalOrders,
      totalUsers,
      ordersByStatus: statusCounts,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        createdAt: order.createdAt,
        itemsCount: order.items.length,
        user: order.user,
        items: order.items.map((item) => ({
          ...item,
          price: Number(item.price),
        })),
      })),
      revenueThisMonth: Number(revenueResult._sum.totalAmount ?? 0),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
