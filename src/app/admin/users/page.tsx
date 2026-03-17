'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatDateTime, formatPhone } from '@/utils/format';
import { Shield, ShieldCheck, User } from 'lucide-react';

const ROLE_FILTERS = ['ALL', 'USER', 'MANAGER', 'ADMIN'];

const ROLE_LABELS: Record<string, string> = {
  USER: 'Пользователь',
  MANAGER: 'Менеджер',
  ADMIN: 'Администратор',
};

const ROLE_VARIANTS: Record<string, 'default' | 'info' | 'warning'> = {
  USER: 'default',
  MANAGER: 'info',
  ADMIN: 'warning',
};

interface UserData {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  phoneVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter !== 'ALL') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data || []);
      }
    } catch {
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Пользователи</h1>

      {/* Role filters */}
      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              roleFilter === role
                ? 'bg-primary-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            )}
          >
            {role === 'ALL' ? 'Все' : ROLE_LABELS[role] || role}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-5 py-3 font-medium text-slate-600">Имя</th>
              <th className="px-5 py-3 font-medium text-slate-600">Телефон</th>
              <th className="px-5 py-3 font-medium text-slate-600">Email</th>
              <th className="px-5 py-3 font-medium text-slate-600">Роль</th>
              <th className="px-5 py-3 font-medium text-slate-600">Верифицирован</th>
              <th className="px-5 py-3 font-medium text-slate-600">Дата регистрации</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        {user.role === 'ADMIN' ? (
                          <ShieldCheck className="h-4 w-4 text-amber-600" />
                        ) : user.role === 'MANAGER' ? (
                          <Shield className="h-4 w-4 text-blue-600" />
                        ) : (
                          <User className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <span className="font-medium text-slate-900">
                        {user.name || 'Без имени'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatPhone(user.phone)}</td>
                  <td className="px-5 py-3 text-slate-600">{user.email || '—'}</td>
                  <td className="px-5 py-3">
                    <Badge variant={ROLE_VARIANTS[user.role] || 'default'}>
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={user.phoneVerified ? 'success' : 'danger'}>
                      {user.phoneVerified ? 'Да' : 'Нет'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(user.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
