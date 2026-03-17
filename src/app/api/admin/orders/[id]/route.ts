import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, notFound, handleApiError } from '@/lib/api-response';
import { updateOrderStatusSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) return notFound('Order not found');

    return success({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: {
          ...item.product,
          image: item.product.images?.[0]?.url || null,
        },
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = updateOrderStatusSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, orderNumber: true },
    });

    if (!order) return notFound('Order not found');

    const previousStatus = order.status;

    const [updatedOrder] = await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: { status: data.status },
        include: {
          user: { select: { id: true, name: true, phone: true } },
          items: {
            select: { id: true, name: true, sku: true, quantity: true, price: true },
          },
          statusLogs: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.orderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: previousStatus,
          toStatus: data.status,
          comment: data.comment,
          changedBy: auth.user.userId,
        },
      }),
    ]);

    await auditLog({
      userId: auth.user.userId,
      action: 'UPDATE_STATUS',
      entity: 'Order',
      entityId: id,
      details: {
        orderNumber: order.orderNumber,
        fromStatus: previousStatus,
        toStatus: data.status,
        comment: data.comment,
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({
      ...updatedOrder,
      totalAmount: Number(updatedOrder.totalAmount),
      items: updatedOrder.items.map((item) => ({
        ...item,
        price: Number(item.price),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
