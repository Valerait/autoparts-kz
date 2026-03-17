'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { useCart } from '@/hooks/useCart';

interface ProductCardProps {
  product: {
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
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+79001234567';
  const inStock = product.quantity > 0;

  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Здравствуйте! Интересует запчасть: ${product.name} (${product.sku})`
  )}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-shadow hover:shadow-md">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative aspect-square bg-slate-50">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <ShoppingCart className="h-12 w-12" />
          </div>
        )}
        {/* Match type badge */}
        {product.matchType && product.matchType !== 'exact' && (
          <Badge className="absolute left-2 top-2" variant={product.matchType === 'analogue' ? 'warning' : 'info'}>
            {product.matchType === 'analogue' ? 'Аналог' : product.matchType === 'oem' ? 'OEM' : product.matchType === 'cross' ? 'Кросс' : 'Похожий'}
          </Badge>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <div className="mb-1 text-xs text-slate-500">{product.brand.name}</div>
        <Link href={`/products/${product.slug}`} className="mb-1 text-sm font-medium text-slate-900 hover:text-primary-600 line-clamp-2">
          {product.name}
        </Link>
        <div className="mb-2 text-xs text-slate-400">Арт: {product.sku}</div>
        {product.matchedNumber && (
          <div className="mb-2 text-xs text-primary-600">Номер: {product.matchedNumber}</div>
        )}

        <div className="mt-auto">
          {/* Price */}
          <div className="mb-2">
            {product.price ? (
              <span className="text-lg font-bold text-slate-900">{formatPrice(product.price)}</span>
            ) : (
              <span className="text-sm font-medium text-accent-600">Цена по запросу</span>
            )}
          </div>

          {/* Stock */}
          <div className="mb-3 text-xs">
            {inStock ? (
              <span className="text-green-600">✓ В наличии</span>
            ) : product.isOnOrder ? (
              <span className="text-yellow-600">⏱ Под заказ</span>
            ) : (
              <span className="text-red-500">✕ Нет в наличии</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => addToCart(product.id)}
              disabled={!inStock && !product.isOnOrder}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              В корзину
            </Button>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg bg-whatsapp p-2 text-white transition-colors hover:bg-green-600"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
