'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import {
  formatPrice,
  formatDateTime,
  formatPhone,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '@/utils/format';
import { X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

const ALL_STATUSES = ['ALL', 'NEW', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

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
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  comment?: string;
  total: number;
  status: string;
  createdAt: string;
  items?: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const limit = 20;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/orders?${params}`);
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data?.orders || json.data || []);
        setTotal(json.data?.total || 0);
      }
    } catch {
      toast.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const changeStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`Сменить статус на "${ORDER_STATUS_LABELS[newStatus]}"?`)) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success('Статус обновлён');
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      } else {
        toast.error('Ошибка обновления статуса');
      }
    } catch {
      toast.error('Ошибка обновления статуса');
    } finally {
      setChangingStatus(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Заказы</h1>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status);
              setPage(1);
            }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            {status === 'ALL' ? 'Все' : ORDER_STATUS_LABELS[status] || status}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Номер</th>
              <th className="px-4 py-3 font-medium text-slate-600">Клиент</th>
              <th className="px-4 py-3 font-medium text-slate-600">Телефон</th>
              <th className="px-4 py-3 font-medium text-slate-600">Сумма</th>
              <th className="px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="px-4 py-3 font-medium text-slate-600">Дата</th>
              <th className="px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  Загрузка...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  Заказов не найдено
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-primary-600">
                    #{order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{order.customerName}</td>
                  <td className="px-4 py-3 text-slate-600">{formatPhone(order.customerPhone)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={(e) => changeStatus(order.id, e.target.value)}
                      disabled={changingStatus}
                      className={cn(
                        'rounded-full border-0 px-2.5 py-0.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500',
                        ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(order.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Заказ #{selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Клиент:</span>
                  <p className="font-medium text-slate-900">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Телефон:</span>
                  <p className="font-medium text-slate-900">
                    {formatPhone(selectedOrder.customerPhone)}
                  </p>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    <span className="text-slate-500">Email:</span>
                    <p className="font-medium text-slate-900">{selectedOrder.customerEmail}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">Сумма:</span>
                  <p className="font-medium text-slate-900">{formatPrice(selectedOrder.total)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Статус:</span>
                  <p>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                        ORDER_STATUS_COLORS[selectedOrder.status]
                      )}
                    >
                      {ORDER_STATUS_LABELS[selectedOrder.status]}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Дата:</span>
                  <p className="font-medium text-slate-900">
                    {formatDateTime(selectedOrder.createdAt)}
                  </p>
                </div>
              </div>

              {selectedOrder.deliveryAddress && (
                <div className="text-sm">
                  <span className="text-slate-500">Адрес доставки:</span>
                  <p className="font-medium text-slate-900">{selectedOrder.deliveryAddress}</p>
                </div>
              )}

              {selectedOrder.comment && (
                <div className="text-sm">
                  <span className="text-slate-500">Комментарий:</span>
                  <p className="text-slate-700">{selectedOrder.comment}</p>
                </div>
              )}

              {/* Order items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-700">Товары</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{item.productName}</p>
                          <p className="text-xs text-slate-500">Арт: {item.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-900">
                            {item.quantity} x {formatPrice(item.price)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(item.quantity * item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Change status */}
              <div className="border-t border-slate-200 pt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Изменить статус
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => changeStatus(selectedOrder.id, e.target.value)}
                  disabled={changingStatus}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
