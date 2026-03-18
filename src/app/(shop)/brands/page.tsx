import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Бренды автозапчастей — АвтоЗапчасти КЗ',
  description: 'Все бренды автозапчастей в нашем каталоге. Оригинальные и аналоговые запчасти с доставкой по Казахстану.',
};

async function getBrands() {
  try {
    return await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const brands = await getBrands();

  // Group brands alphabetically
  const grouped = brands.reduce<Record<string, typeof brands>>((acc, brand) => {
    const letter = brand.name[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(brand);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">Бренды</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Бренды</h1>
      <p className="mb-8 text-slate-500">{brands.length} брендов в каталоге</p>

      {brands.length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          <p className="text-lg">Бренды пока не добавлены.</p>
        </div>
      ) : (
        <>
          {/* Letter navigation */}
          {letters.length > 5 && (
            <div className="mb-6 flex flex-wrap gap-1">
              {letters.map((letter) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-sm font-medium text-slate-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  {letter}
                </a>
              ))}
            </div>
          )}

          {/* Brands by letter */}
          <div className="space-y-8">
            {letters.map((letter) => (
              <div key={letter} id={`letter-${letter}`}>
                <h2 className="mb-3 text-lg font-bold text-slate-700 border-b border-slate-200 pb-1">{letter}</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {grouped[letter].map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brands/${brand.slug}`}
                      className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-4 text-center transition-shadow hover:shadow-md"
                    >
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="mb-2 h-10 object-contain"
                        />
                      ) : (
                        <div className="mb-2 text-sm font-bold text-slate-800">{brand.name}</div>
                      )}
                      {brand.logo && (
                        <span className="text-xs text-slate-500">{brand.name}</span>
                      )}
                      {brand._count.products > 0 && (
                        <span className="mt-1 text-xs text-slate-400">{brand._count.products} тов.</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
