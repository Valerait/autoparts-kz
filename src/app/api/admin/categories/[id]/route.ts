import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, notFound, error, handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';
import slugify from 'slugify';
import { z } from 'zod';

const updateCategorySchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().nullable().optional(),
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
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    if (!category) return notFound('Category not found');
    return success(category);
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
    const data = updateCategorySchema.parse(body);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return notFound('Category not found');

    // Prevent setting itself as parent
    if (data.parentId === id) {
      return error('Категория не может быть родителем самой себя', 400);
    }

    const slug = slugify(data.name, { lower: true, strict: true });
    let finalSlug = slug;
    if (slug !== existing.slug) {
      let suffix = 1;
      while (await prisma.category.findFirst({ where: { slug: finalSlug, id: { not: id } } })) {
        finalSlug = `${slug}-${suffix}`;
        suffix++;
      }
    } else {
      finalSlug = existing.slug;
    }

    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) return error('Родительская категория не найдена', 400);
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: finalSlug,
        parentId: data.parentId !== undefined ? data.parentId : existing.parentId,
        description: data.description,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: true,
      },
    });

    await auditLog({
      userId: auth.user.userId,
      action: 'UPDATE',
      entity: 'Category',
      entityId: category.id,
      details: { name: category.name },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success(category);
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });
    if (!category) return notFound('Category not found');

    if (category._count.products > 0) {
      return error(`Невозможно удалить категорию "${category.name}" — к ней привязано ${category._count.products} товаров`, 400);
    }

    if (category._count.children > 0) {
      return error(`Невозможно удалить категорию "${category.name}" — у неё есть ${category._count.children} подкатегорий`, 400);
    }

    await prisma.category.delete({ where: { id } });

    await auditLog({
      userId: auth.user.userId,
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
      details: { name: category.name },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
