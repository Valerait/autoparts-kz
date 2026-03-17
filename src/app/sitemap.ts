import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  try {
    const [categories, brands, products] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.brand.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true }, take: 5000, orderBy: { updatedAt: 'desc' } }),
    ]);

    return [
      ...staticPages,
      ...categories.map((c) => ({ url: `${baseUrl}/categories/${c.slug}`, lastModified: c.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
      ...brands.map((b) => ({ url: `${baseUrl}/brands/${b.slug}`, lastModified: b.updatedAt, changeFrequency: 'weekly' as const, priority: 0.7 })),
      ...products.map((p) => ({ url: `${baseUrl}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'weekly' as const, priority: 0.6 })),
    ];
  } catch {
    return staticPages;
  }
}
