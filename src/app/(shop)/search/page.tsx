'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, SearchX } from 'lucide-react';
import { SearchBox } from '@/components/shop/SearchBox';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/Button';

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  quantity: number;
  isOnOrder: boolean;
  brand: { name: string; slug: string };
  image: string | null;
  matchType?: string;
  matchedNumber?: string;
}

interface SearchResponse {
  data: ProductResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const q = searchParams.get('q') || '';
  const makeId = searchParams.get('makeId') || '';
  const modelId = searchParams.get('modelId') || '';
  const year = searchParams.get('year') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [results, setResults] = useState<ProductResult[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      let url: string;

      if (q) {
        url = `/api/products/search?q=${encodeURIComponent(q)}&page=${pageParam}&limit=20`;
      } else if (makeId && modelId) {
        url = `/api/products/by-vehicle?makeId=${makeId}&modelId=${modelId}${year ? `&year=${year}` : ''}&page=${pageParam}&limit=20`;
      } else {
        setResults([]);
        setIsLoading(false);
        return;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Ошибка загрузки');

      const data: SearchResponse = await res.json();
      setResults(data.data || []);
      setPagination({
        page: data.pagination?.page || 1,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 1,
      });
    } catch {
      setError('Произошла ошибка при поиске. Попробуйте позже.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [q, makeId, modelId, year, pageParam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/search?${params.toString()}`);
  };

  const searchTitle = q
    ? `Результаты поиска: "${q}"`
    : makeId && modelId
      ? 'Запчасти по автомобилю'
      : 'Поиск';

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 text-sm text-slate-500">
        <a href="/" className="hover:text-primary-600">Главная</a>
        <span className="mx-2">/</span>
        <span className="text-slate-900">Поиск</span>
      </nav>

      {/* Search box */}
      <div className="mb-6">
        <SearchBox defaultValue={q} placeholder="Введите каталожный номер, артикул или название..." />
      </div>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">{searchTitle}</h1>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="mt-4 text-slate-500">Идёт поиск...</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      )}

      {/* No results */}
      {!isLoading && !error && results.length === 0 && (q || makeId) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchX className="mb-4 h-16 w-16 text-slate-300" />
          <h2 className="mb-2 text-xl font-semibold text-slate-700">Ничего не найдено</h2>
          <p className="max-w-md text-slate-500">
            По вашему запросу не найдено товаров. Попробуйте изменить параметры поиска или свяжитесь с нами для помощи в подборе.
          </p>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && results.length > 0 && (
        <>
          <p className="mb-4 text-sm text-slate-500">
            Найдено: {pagination.total} {pagination.total === 1 ? 'товар' : pagination.total < 5 ? 'товара' : 'товаров'}
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Назад
              </Button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 2;
                })
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  typeof item === 'string' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-slate-400">...</span>
                  ) : (
                    <Button
                      key={item}
                      variant={item === pagination.page ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(item)}
                      className="min-w-[2.5rem]"
                    >
                      {item}
                    </Button>
                  )
                )}

              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
