import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, handleApiError } from '@/lib/api-response';
import slugify from 'slugify';
import { z } from 'zod';

const createBrandSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const brands = await prisma.brand.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { products: true } },
      },
    });

    return success(brands);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const data = createBrandSchema.parse(body);

    const slug = slugify(data.name, { lower: true, strict: true });

    let finalSlug = slug;
    let suffix = 1;
    while (await prisma.brand.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${suffix}`;
      suffix++;
    }

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        slug: finalSlug,
        description: data.description,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDesc,
      },
    });

    return success(brand, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
