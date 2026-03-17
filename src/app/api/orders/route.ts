import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validation';
import { success, error, unauthorized, handleApiError } from '@/lib/api-response';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const orders = await prisma.order.findMany({
      where: { userId: auth.userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(orders);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const data = createOrderSchema.parse(body);

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: auth.userId },
      include: {
        product: true,
      },
    });

    if (cartItems.length === 0) {
      return error('Cart is empty', 400);
    }

    // Calculate total
    const totalAmount = cartItems.reduce((sum, item) => {
      const price = item.product.price ? Number(item.product.price) : 0;
      return sum + price * item.quantity;
    }, 0);

    const orderNumber = generateOrderNumber();

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: auth.userId,
          status: 'NEW',
          totalAmount,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || null,
          deliveryAddress: data.deliveryAddress || null,
          comment: data.comment || null,
          contactMethod: data.contactMethod,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price ?? 0,
              name: item.product.name,
              sku: item.product.sku,
            })),
          },
          statusLogs: {
            create: {
              fromStatus: null,
              toStatus: 'NEW',
              comment: 'Order created',
            },
          },
        },
        include: {
          items: true,
          statusLogs: true,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({
        where: { userId: auth.userId },
      });

      return newOrder;
    });

    return success(order, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
