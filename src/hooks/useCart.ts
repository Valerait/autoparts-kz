'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    price: number | null;
    quantity: number;
    isOnOrder: boolean;
    brand: { name: string };
    images: { url: string }[];
  };
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  isLoading: false,
  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/cart');
      if (res.ok) {
        const data = await res.json();
        set({ items: data.data || [], isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
  addToCart: async (productId, quantity = 1) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        toast.success('Добавлено в корзину');
        get().fetchCart();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Ошибка');
      }
    } catch {
      toast.error('Ошибка при добавлении');
    }
  },
  updateQuantity: async (itemId, quantity) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      });
      if (res.ok) get().fetchCart();
    } catch {
      toast.error('Ошибка при обновлении');
    }
  },
  removeItem: async (itemId) => {
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Удалено из корзины');
        get().fetchCart();
      }
    } catch {
      toast.error('Ошибка при удалении');
    }
  },
  totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
  totalAmount: () =>
    get().items.reduce((sum, item) => {
      const price = item.product.price || 0;
      return sum + price * item.quantity;
    }, 0),
}));
