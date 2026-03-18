import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Каталог запчастей — АвтоЗапчасти КЗ',
  description: 'Полный каталог автозапчастей. Поиск по категориям, брендам и моделям автомобилей. Доставка по всему Казахстану.',
};

async function getCategories() {
  try {
    return await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, slug: true },
        },
        _count: { select: { products: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">Каталог</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">Каталог запчастей</h1>

      {categories.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg">Категории пока не добавлены.</p>
          <p className="mt-2 text-sm">Воспользуйтесь поиском или свяжитесь с нами.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Link
                href={`/categories/${cat.slug}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="h-12 w-12 object-contain flex-shrink-0" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xl font-bold">
                    {cat.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{cat.name}</div>
                  {cat._count.products > 0 && (
                    <div className="text-xs text-slate-400 mt-0.5">{cat._count.products} товаров</div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </Link>

              {cat.children.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {cat.children.slice(0, 6).map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug}`}
                        className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        {child.name}
                      </Link>
                    ))}
                    {cat.children.length > 6 && (
                      <Link
                        href={`/categories/${cat.slug}`}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        ещё {cat.children.length - 6}...
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
