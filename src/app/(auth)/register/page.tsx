'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

interface RegisterFormData {
  phone: string;
  password: string;
  name?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Ошибка регистрации');
        return;
      }

      toast.success('Регистрация успешна');
      await fetchUser();
      router.push('/');
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">Регистрация</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="reg-phone"
          label="Телефон"
          type="tel"
          placeholder="+7 (999) 123-45-67"
          error={errors.phone?.message}
          {...register('phone', {
            required: 'Введите номер телефона',
          })}
        />
        <Input
          id="reg-password"
          label="Пароль"
          type="password"
          placeholder="Минимум 6 символов"
          error={errors.password?.message}
          {...register('password', {
            required: 'Введите пароль',
            minLength: { value: 6, message: 'Минимум 6 символов' },
          })}
        />
        <Input
          id="reg-name"
          label="Имя (необязательно)"
          type="text"
          placeholder="Иван"
          error={errors.name?.message}
          {...register('name')}
        />

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          <UserPlus className="h-4 w-4" />
          Зарегистрироваться
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-700">
          Войти
        </Link>
      </div>
    </div>
  );
}
