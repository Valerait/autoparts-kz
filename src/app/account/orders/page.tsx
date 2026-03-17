'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/format';

interface OrderItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error();
        const json = await res.json();
        setOrders(json.data || []);
      } catch {
        toast.error('Не удалось загрузить заказы');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
        <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Нет заказов</h2>
        <p className="text-sm text-slate-500">Вы ещё не сделали ни одного заказа</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Мои заказы</h2>

      {orders.map((order) => {
        const isExpanded = expandedId === order.id;
        const statusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
        const statusColor = ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700';

        return (
          <div
            key={order.id}
            className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            {/* Order header */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : order.id)}
              className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50 sm:p-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-sm font-semibold text-slate-900">
                    #{order.orderNumber}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>{formatDate(order.createdAt)}</span>
                  <span>{formatPrice(order.total)}</span>
                  <span>
                    {order.items.length}{' '}
                    {order.items.length === 1 ? 'товар' : order.items.length < 5 ? 'товара' : 'товаров'}
                  </span>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
              ) : (
                <ChevronDown className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
              )}
            </button>

            {/* Order items */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6">
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3 ring-1 ring-slate-200"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">Арт: {item.sku}</p>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice(item.price)}
                        </p>
                        <p className="text-xs text-slate-500">x{item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
