import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, PackageSearch } from 'lucide-react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { ProductCard } from '@/components/shop/ProductCard';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 24;

async function getCategoryData(slug: string, page: number) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!category) return null;

    const skip = (page - 1) * PAGE_SIZE;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId: category.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          price: true,
          quantity: true,
          isOnOrder: true,
          brand: { select: { name: true, slug: true } },
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true },
          },
        },
      }),
      prisma.product.count({
        where: { categoryId: category.id, isActive: true },
      }),
    ]);

    const mappedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: p.price ? Number(p.price) : null,
      quantity: p.quantity,
      isOnOrder: p.isOnOrder,
      brand: p.brand,
      image: p.images[0]?.url ?? null,
    }));

    return { category, products: mappedProducts, total };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryData(slug, 1);

  if (!data) return { title: 'Категория не найдена' };

  const { category } = data;
  const title = category.metaTitle || `${category.name} — купить в Казахстане`;
  const description =
    category.metaDesc ||
    category.description ||
    `Купить ${category.name} в интернет-магазине АвтоЗапчасти КЗ. Широкий ассортимент, доставка по всему Казахстану.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: category.image ? [category.image] : undefined,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || '1', 10));

  const data = await getCategoryData(slug, page);

  if (!data) notFound();

  const { category, products, total } = data;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const pluralProducts = (n: number) => {
    if (n % 10 === 1 && n % 100 !== 11) return 'товар';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'товара';
    return 'товаров';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        {category.parent && (
          <>
            <Link href={`/categories/${category.parent.slug}`} className="hover:text-primary-600">
              {category.parent.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-slate-900">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-slate-500">{category.description}</p>
        )}
        <p className="mt-1 text-sm text-slate-400">
          {total} {pluralProducts(total)}
        </p>
      </div>

      {/* Subcategories */}
      {category.children.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Подкатегории</h2>
          <div className="flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/categories/${child.slug}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700"
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PackageSearch className="mb-4 h-16 w-16 text-slate-300" />
          <h2 className="mb-2 text-xl font-semibold text-slate-700">Товары не найдены</h2>
          <p className="max-w-md text-slate-500">
            В данной категории пока нет товаров. Попробуйте поискать в других категориях или свяжитесь с нами.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            На главную
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={`/categories/${slug}?page=${page - 1}`}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Назад
                </Link>
              )}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  typeof item === 'string' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400">...</span>
                  ) : (
                    <Link
                      key={item}
                      href={`/categories/${slug}?page=${item}`}
                      className={`min-w-[2.5rem] rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
                        item === page
                          ? 'border-primary-600 bg-primary-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </Link>
                  )
                )}

              {page < totalPages && (
                <Link
                  href={`/categories/${slug}?page=${page + 1}`}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Вперёд
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
