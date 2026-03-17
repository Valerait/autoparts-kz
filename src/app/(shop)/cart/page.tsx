'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/format';

export default function CartPage() {
  const { items, isLoading, fetchCart, updateQuantity, removeItem, totalAmount } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (isLoading) {
    return (
      <div className="container-main py-12">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-main py-12">
        <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
          <ShoppingCart className="mb-4 h-16 w-16 text-slate-300" />
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Корзина пуста</h1>
          <p className="mb-6 text-slate-500">
            Добавьте товары в корзину, чтобы оформить заказ
          </p>
          <Link href="/search">
            <Button size="lg">Перейти к каталогу</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-8 md:py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 md:text-3xl">Корзина</h1>

      {/* Header (desktop) */}
      <div className="hidden border-b border-slate-200 pb-3 md:grid md:grid-cols-12 md:gap-4">
        <div className="col-span-6 text-sm font-medium text-slate-500">Товар</div>
        <div className="col-span-2 text-center text-sm font-medium text-slate-500">Цена</div>
        <div className="col-span-2 text-center text-sm font-medium text-slate-500">Количество</div>
        <div className="col-span-1 text-right text-sm font-medium text-slate-500">Сумма</div>
        <div className="col-span-1" />
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-200">
        {items.map((item) => {
          const imageUrl = item.product.images?.[0]?.url;
          const price = item.product.price;
          const lineTotal = price != null ? price * item.quantity : null;

          return (
            <div
              key={item.id}
              className="grid grid-cols-1 gap-4 py-4 md:grid-cols-12 md:items-center"
            >
              {/* Product info */}
              <div className="col-span-6 flex gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="line-clamp-2 text-sm font-medium text-slate-900 hover:text-primary-600"
                  >
                    {item.product.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Артикул: {item.product.sku}
                  </p>
                  {item.product.brand && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Бренд: {item.product.brand.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-medium text-slate-900 md:text-base">
                  {formatPrice(price)}
                </span>
              </div>

              {/* Quantity controls */}
              <div className="col-span-2 flex items-center justify-center">
                <div className="inline-flex items-center rounded-lg border border-slate-300">
                  <button
                    type="button"
                    onClick={() =>
                      item.quantity > 1
                        ? updateQuantity(item.id, item.quantity - 1)
                        : removeItem(item.id)
                    }
                    className="flex h-8 w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100"
                    aria-label="Уменьшить количество"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-8 w-8 items-center justify-center border-x border-slate-300 text-sm font-medium text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-slate-600 transition-colors hover:bg-slate-100"
                    aria-label="Увеличить количество"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Line total */}
              <div className="col-span-1 text-right">
                <span className="text-sm font-semibold text-slate-900">
                  {formatPrice(lineTotal)}
                </span>
              </div>

              {/* Remove button */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Удалить товар"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total & checkout */}
      <div className="mt-6 flex flex-col items-end gap-4 border-t border-slate-200 pt-6">
        <div className="flex w-full items-center justify-between md:w-auto md:gap-8">
          <span className="text-lg font-medium text-slate-700">Итого:</span>
          <span className="text-2xl font-bold text-slate-900">
            {formatPrice(totalAmount())}
          </span>
        </div>
        <p className="text-xs text-slate-500">Доставка по всему Казахстану</p>
        <Link href="/checkout" className="w-full md:w-auto">
          <Button size="lg" className="w-full md:w-auto">
            Оформить заказ
          </Button>
        </Link>
      </div>
    </div>
  );
}
