import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, notFound, handleApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        catalogNumbers: true,
        attributes: true,
        vehicleApps: {
          include: {
            vehicleYear: {
              include: {
                model: {
                  include: {
                    make: true,
                  },
                },
              },
            },
          },
        },
        analoguesOf: {
          include: {
            analogue: {
              include: {
                brand: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return notFound('Product not found');
    }

    return success(product);
  } catch (err) {
    return handleApiError(err);
  }
}
