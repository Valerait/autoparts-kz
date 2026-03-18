'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatDateTime, formatPhone } from '@/utils/format';
import { Shield, ShieldCheck, User, Edit2, Trash2, X, Ban, CheckCircle } from 'lucide-react';

const ROLE_FILTERS = ['ALL', 'CUSTOMER', 'MANAGER', 'ADMIN'];

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Покупатель',
  MANAGER: 'Менеджер',
  ADMIN: 'Администратор',
};

const ROLE_VARIANTS: Record<string, 'default' | 'info' | 'warning'> = {
  CUSTOMER: 'default',
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
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number; favorites: number };
}

interface UserFormData {
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  password: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>();

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

  const openEdit = (user: UserData) => {
    setEditingUser(user);
    reset({
      name: user.name || '',
      email: user.email || '',
      role: user.role,
      isActive: user.isActive,
      password: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: UserFormData) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      };
      if (data.password) body.password = data.password;

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Пользователь обновлён');
        setModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: UserData) => {
    const newStatus = !user.isActive;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        toast.success(newStatus ? 'Пользователь активирован' : 'Пользователь заблокирован');
        fetchUsers();
      } else {
        toast.error('Ошибка');
      }
    } catch {
      toast.error('Ошибка');
    }
  };

  const deleteUser = async (user: UserData) => {
    if (!confirm(`Удалить пользователя ${user.name || user.phone}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        if (json.data?.deactivated) {
          toast.success(json.data.reason);
        } else {
          toast.success('Пользователь удалён');
        }
        fetchUsers();
      } else {
        toast.error(json.error || 'Ошибка удаления');
      }
    } catch {
      toast.error('Ошибка удаления');
    }
  };

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
              <th className="px-5 py-3 font-medium text-slate-600">Статус</th>
              <th className="px-5 py-3 font-medium text-slate-600">Заказы</th>
              <th className="px-5 py-3 font-medium text-slate-600">Дата</th>
              <th className="px-5 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={cn(
                    'border-b border-slate-100 transition-colors hover:bg-slate-50',
                    !user.isActive && 'opacity-50'
                  )}
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
                    <Badge variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Активен' : 'Заблокирован'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{user._count?.orders ?? 0}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                        title="Редактировать"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(user)}
                        className={cn(
                          'rounded-lg p-1.5 transition-colors',
                          user.isActive
                            ? 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'
                            : 'text-slate-500 hover:bg-green-50 hover:text-green-600'
                        )}
                        title={user.isActive ? 'Заблокировать' : 'Разблокировать'}
                      >
                        {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteUser(user)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {modalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Редактирование пользователя
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Телефон: <span className="font-medium">{formatPhone(editingUser.phone)}</span>
              </div>

              <Input
                label="Имя"
                {...register('name')}
                error={errors.name?.message}
              />

              <Input
                label="Email"
                type="email"
                {...register('email')}
              />

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Роль</label>
                <select
                  {...register('role')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="CUSTOMER">Покупатель</option>
                  <option value="MANAGER">Менеджер</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('isActive')} className="rounded" />
                Активен
              </label>

              <div className="border-t border-slate-200 pt-4">
                <Input
                  label="Новый пароль (оставьте пустым чтобы не менять)"
                  type="password"
                  {...register('password')}
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" isLoading={saving}>
                  Сохранить
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
