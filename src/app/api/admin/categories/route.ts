import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, handleApiError } from '@/lib/api-response';
import slugify from 'slugify';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  parentId: z.string().optional(),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          include: {
            children: {
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            },
            _count: { select: { products: true } },
          },
          where: { isActive: true },
        },
        _count: { select: { products: true } },
      },
      where: { parentId: null },
    });

    return success(categories);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const slug = slugify(data.name, { lower: true, strict: true });

    let finalSlug = slug;
    let suffix = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    if (data.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
      if (!parent) {
        return handleApiError(new Error('Parent category not found'));
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: finalSlug,
        parentId: data.parentId || null,
        description: data.description,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: true,
      },
    });

    return success(category, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
