'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  quantity: number;
  isOnOrder: boolean;
  brand: { name: string; slug: string };
  image: string | null;
}

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch('/api/favorites');
        if (!res.ok) throw new Error();
        const json = await res.json();
        setProducts(json.data || []);
      } catch {
        toast.error('Не удалось загрузить избранное');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
        <Heart className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Избранное пусто</h2>
        <p className="text-sm text-slate-500">
          Добавляйте товары в избранное, чтобы не потерять их
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        Избранное ({products.length})
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
