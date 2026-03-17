import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { addToCartSchema, updateCartSchema } from '@/lib/validation';
import { success, unauthorized, notFound, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: auth.userId },
      include: {
        product: {
          include: {
            brand: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(cartItems);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const { productId, quantity } = addToCartSchema.parse(body);

    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: auth.userId,
          productId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        userId: auth.userId,
        productId,
        quantity,
      },
      include: {
        product: {
          include: {
            brand: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    return success(cartItem, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const { itemId, ...rest } = body;
    const { quantity } = updateCartSchema.parse(rest);

    if (!itemId) {
      return notFound('Item ID is required');
    }

    // If quantity is 0, delete the item
    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { id: itemId, userId: auth.userId },
      });
      return success({ deleted: true });
    }

    const cartItem = await prisma.cartItem.updateMany({
      where: { id: itemId, userId: auth.userId },
      data: { quantity },
    });

    if (cartItem.count === 0) {
      return notFound('Cart item not found');
    }

    return success({ updated: true, quantity });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { searchParams } = request.nextUrl;
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return notFound('Item ID is required');
    }

    const result = await prisma.cartItem.deleteMany({
      where: { id: itemId, userId: auth.userId },
    });

    if (result.count === 0) {
      return notFound('Cart item not found');
    }

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
