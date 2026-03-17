'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingBag, Users, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice, formatDateTime, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/utils/format';

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  monthRevenue: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  ordersByStatus: Record<string, number>;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  const stats = [
    {
      name: 'Товары',
      value: data?.totalProducts ?? 0,
      icon: Package,
      color: 'bg-blue-500',
      href: '/admin/products',
    },
    {
      name: 'Заказы',
      value: data?.totalOrders ?? 0,
      icon: ShoppingBag,
      color: 'bg-green-500',
      href: '/admin/orders',
    },
    {
      name: 'Пользователи',
      value: data?.totalUsers ?? 0,
      icon: Users,
      color: 'bg-purple-500',
      href: '/admin/users',
    },
    {
      name: 'Выручка за месяц',
      value: formatPrice(data?.monthRevenue ?? 0),
      icon: DollarSign,
      color: 'bg-orange-500',
      href: '/admin/orders',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <button
            key={stat.name}
            onClick={() => router.push(stat.href)}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left transition-shadow hover:shadow-md"
          >
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg text-white', stat.color)}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.name}</p>
              <p className="text-xl font-bold text-slate-900">
                {typeof stat.value === 'number' ? stat.value.toLocaleString('ru-RU') : stat.value}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Последние заказы</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left">
                  <th className="px-5 py-3 font-medium text-slate-600">Номер</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Клиент</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Сумма</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Статус</th>
                  <th className="px-5 py-3 font-medium text-slate-600">Дата</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentOrders?.length ? (
                  data.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/admin/orders?id=${order.id}`)}
                      className="cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 font-medium text-primary-600">
                        #{order.orderNumber}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{order.customerName}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                            ORDER_STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Нет заказов
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Orders by status */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Заказы по статусам</h2>
          </div>
          <div className="space-y-3 p-5">
            {data?.ordersByStatus &&
              Object.entries(data.ordersByStatus).map(([status, count]) => {
                const total = Object.values(data.ordersByStatus).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {ORDER_STATUS_LABELS[status] || status}
                      </span>
                      <span className="font-medium text-slate-900">{count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          status === 'NEW' && 'bg-blue-500',
                          status === 'PROCESSING' && 'bg-yellow-500',
                          status === 'CONFIRMED' && 'bg-green-500',
                          status === 'SHIPPED' && 'bg-purple-500',
                          status === 'COMPLETED' && 'bg-gray-500',
                          status === 'CANCELLED' && 'bg-red-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            {(!data?.ordersByStatus || Object.keys(data.ordersByStatus).length === 0) && (
              <p className="py-4 text-center text-sm text-slate-400">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
