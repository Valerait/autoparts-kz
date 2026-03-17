'use client';

import { useState } from 'react';
import { ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';

interface AddToCartButtonProps {
  productId: string;
  disabled?: boolean;
}

export function AddToCartButton({ productId, disabled }: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    await addToCart(productId, quantity);
    setIsAdding(false);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Quantity selector */}
      <div className="flex items-center rounded-lg border border-slate-300">
        <button
          type="button"
          className="px-3 py-2.5 text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1 || disabled}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="min-w-[2.5rem] text-center text-sm font-medium text-slate-900">
          {quantity}
        </span>
        <button
          type="button"
          className="px-3 py-2.5 text-slate-500 transition-colors hover:text-slate-700 disabled:opacity-50"
          onClick={() => setQuantity((q) => q + 1)}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Button
        size="lg"
        onClick={handleAdd}
        disabled={disabled}
        isLoading={isAdding}
        className="flex-1 sm:flex-none"
      >
        <ShoppingCart className="h-5 w-5" />
        Добавить в корзину
      </Button>
    </div>
  );
}
