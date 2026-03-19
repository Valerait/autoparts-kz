import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, notFound, handleApiError } from '@/lib/api-response';
import { adminProductSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';
import { normalizePartNumber } from '@/services/catalog-search';
import slugify from 'slugify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        catalogNumbers: true,
        attributes: true,
      },
    });

    if (!product) return notFound('Product not found');

    return success({
      ...product,
      price: product.price ? Number(product.price) : null,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
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
    const data = adminProductSchema.parse(body);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return notFound('Product not found');

    const slug = slugify(data.name, { lower: true, strict: true });
    let finalSlug = slug;
    if (slug !== existing.slug) {
      let suffix = 1;
      while (await prisma.product.findFirst({ where: { slug: finalSlug, id: { not: id } } })) {
        finalSlug = `${slug}-${suffix}`;
        suffix++;
      }
    } else {
      finalSlug = existing.slug;
    }

    // Delete old catalog numbers and recreate
    await prisma.catalogNumber.deleteMany({ where: { productId: id } });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: finalSlug,
        sku: data.sku,
        brandId: data.brandId,
        categoryId: data.categoryId,
        description: data.description,
        shortDescription: data.shortDescription,
        price: data.price,
        comparePrice: data.comparePrice,
        quantity: data.quantity,
        isActive: data.isActive,
        isOnOrder: data.isOnOrder,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        catalogNumbers: data.catalogNumbers
          ? {
              create: data.catalogNumbers.map((cn) => ({
                originalNumber: cn.originalNumber,
                normalizedNumber: normalizePartNumber(cn.originalNumber),
                numberType: cn.numberType,
                brandName: cn.brandName,
              })),
            }
          : undefined,
      },
      include: {
        brand: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        catalogNumbers: true,
        images: true,
      },
    });

    await auditLog({
      userId: auth.user.userId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: product.id,
      details: { name: product.name, sku: product.sku },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({
      ...product,
      price: product.price ? Number(product.price) : null,
      comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
      costPrice: product.costPrice ? Number(product.costPrice) : null,
      weight: product.weight ? Number(product.weight) : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, sku: true },
    });
    if (!product) return notFound('Product not found');

    // Delete related records first
    await prisma.$transaction([
      prisma.catalogNumber.deleteMany({ where: { productId: id } }),
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productAttribute.deleteMany({ where: { productId: id } }),
      prisma.productAnalogue.deleteMany({ where: { OR: [{ originalId: id }, { analogueId: id }] } }),
      prisma.vehicleApplication.deleteMany({ where: { productId: id } }),
      prisma.warehouseStock.deleteMany({ where: { productId: id } }),
      prisma.cartItem.deleteMany({ where: { productId: id } }),
      prisma.favorite.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);

    await auditLog({
      userId: auth.user.userId,
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      details: { name: product.name, sku: product.sku },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
