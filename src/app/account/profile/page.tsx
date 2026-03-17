'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Save, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { formatPhone } from '@/utils/format';

interface ProfileFormData {
  name: string;
  email: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, fetchUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || 'Ошибка сохранения');
        return;
      }

      toast.success('Профиль обновлён');
      await fetchUser();
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из аккаунта');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user.name || 'Пользователь'}
            </h2>
            <p className="text-sm text-slate-500">{formatPhone(user.phone)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="profile-name"
              label="Имя"
              placeholder="Введите имя"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              id="profile-email"
              label="Email"
              type="email"
              placeholder="example@mail.ru"
              error={errors.email?.message}
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Неверный формат email',
                },
              })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Телефон</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {formatPhone(user.phone)}
            </div>
            <p className="mt-1 text-xs text-slate-400">Телефон нельзя изменить</p>
          </div>

          <Button type="submit" isLoading={isSubmitting}>
            <Save className="h-4 w-4" />
            Сохранить
          </Button>
        </form>
      </div>

      {/* Logout */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="mb-2 text-base font-semibold text-slate-900">Выход</h3>
        <p className="mb-4 text-sm text-slate-500">
          Вы будете перенаправлены на главную страницу
        </p>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
