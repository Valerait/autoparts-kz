import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, paginated, handleApiError } from '@/lib/api-response';
import { adminProductSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';
import { normalizePartNumber } from '@/services/catalog-search';
import slugify from 'slugify';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const offset = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          {
            catalogNumbers: {
              some: {
                originalNumber: { contains: search, mode: 'insensitive' },
              },
            },
          },
        ],
      }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, url: true, alt: true, isPrimary: true, sortOrder: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const mapped = products.map((p) => ({
      ...p,
      price: p.price ? Number(p.price) : null,
      comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
      costPrice: p.costPrice ? Number(p.costPrice) : null,
      weight: p.weight ? Number(p.weight) : null,
    }));

    return paginated(mapped, total, page, limit);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const data = adminProductSchema.parse(body);

    const slug = slugify(data.name, { lower: true, strict: true });

    // Ensure unique slug
    let finalSlug = slug;
    let suffix = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    const product = await prisma.product.create({
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
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      details: { name: product.name, sku: product.sku },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success(
      {
        ...product,
        price: product.price ? Number(product.price) : null,
        comparePrice: product.comparePrice ? Number(product.comparePrice) : null,
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        weight: product.weight ? Number(product.weight) : null,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
