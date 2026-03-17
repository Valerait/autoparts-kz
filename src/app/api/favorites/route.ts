import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { success, unauthorized, notFound, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const favorites = await prisma.favorite.findMany({
      where: { userId: auth.userId },
      include: {
        product: {
          include: {
            brand: true,
            category: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return success(favorites);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const { productId } = body;

    if (!productId || typeof productId !== 'string') {
      return notFound('Product ID is required');
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId: auth.userId,
          productId,
        },
      },
      update: {},
      create: {
        userId: auth.userId,
        productId,
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

    return success(favorite, 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { searchParams } = request.nextUrl;
    const productId = searchParams.get('productId');

    if (!productId) {
      return notFound('Product ID is required');
    }

    const result = await prisma.favorite.deleteMany({
      where: {
        userId: auth.userId,
        productId,
      },
    });

    if (result.count === 0) {
      return notFound('Favorite not found');
    }

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
