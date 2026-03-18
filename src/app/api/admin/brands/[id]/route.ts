import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, notFound, error, handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';
import slugify from 'slugify';
import { z } from 'zod';

const updateBrandSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) return notFound('Brand not found');
    return success(brand);
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
    const data = updateBrandSchema.parse(body);

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) return notFound('Brand not found');

    let finalSlug = data.slug || slugify(data.name, { lower: true, strict: true });
    if (finalSlug !== existing.slug) {
      let suffix = 1;
      while (await prisma.brand.findFirst({ where: { slug: finalSlug, id: { not: id } } })) {
        finalSlug = `${finalSlug}-${suffix}`;
        suffix++;
      }
    }

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      include: { _count: { select: { products: true } } },
    });

    await auditLog({
      userId: auth.user.userId,
      action: 'UPDATE',
      entity: 'Brand',
      entityId: brand.id,
      details: { name: brand.name },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success(brand);
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

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!brand) return notFound('Brand not found');

    if (brand._count.products > 0) {
      return error(`Невозможно удалить бренд "${brand.name}" — к нему привязано ${brand._count.products} товаров`, 400);
    }

    await prisma.brand.delete({ where: { id } });

    await auditLog({
      userId: auth.user.userId,
      action: 'DELETE',
      entity: 'Brand',
      entityId: id,
      details: { name: brand.name },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
