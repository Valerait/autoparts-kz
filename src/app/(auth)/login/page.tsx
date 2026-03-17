'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Phone, Lock, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'phone' | 'whatsapp';

interface LoginFormData {
  phone: string;
  password: string;
}

interface WhatsAppFormData {
  phone: string;
}

interface OtpFormData {
  code: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('phone');
  const [otpSent, setOtpSent] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loginForm = useForm<LoginFormData>();
  const whatsappForm = useForm<WhatsAppFormData>();
  const otpForm = useForm<OtpFormData>();

  const handlePhoneLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Ошибка входа');
        return;
      }

      toast.success('Вход выполнен');
      await fetchUser();
      router.push('/');
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (data: WhatsAppFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: data.phone }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Не удалось отправить код');
        return;
      }

      setWhatsappPhone(data.phone);
      setOtpSent(true);
      toast.success('Код отправлен в WhatsApp');
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/whatsapp/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: whatsappPhone, code: data.code }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || 'Неверный код');
        return;
      }

      toast.success('Вход выполнен');
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
      <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">Вход</h1>

      {/* Tabs */}
      <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => { setActiveTab('phone'); setOtpSent(false); }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'phone'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Phone className="h-4 w-4" />
          По телефону
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'whatsapp'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Через WhatsApp
        </button>
      </div>

      {/* Phone + Password Tab */}
      {activeTab === 'phone' && (
        <form onSubmit={loginForm.handleSubmit(handlePhoneLogin)} className="space-y-4">
          <Input
            id="login-phone"
            label="Телефон"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            error={loginForm.formState.errors.phone?.message}
            {...loginForm.register('phone', {
              required: 'Введите номер телефона',
            })}
          />
          <Input
            id="login-password"
            label="Пароль"
            type="password"
            placeholder="Введите пароль"
            error={loginForm.formState.errors.password?.message}
            {...loginForm.register('password', {
              required: 'Введите пароль',
              minLength: { value: 6, message: 'Минимум 6 символов' },
            })}
          />
          <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
            <Lock className="h-4 w-4" />
            Войти
          </Button>
        </form>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && !otpSent && (
        <form onSubmit={whatsappForm.handleSubmit(handleSendOtp)} className="space-y-4">
          <Input
            id="wa-phone"
            label="Телефон WhatsApp"
            type="tel"
            placeholder="+7 (999) 123-45-67"
            error={whatsappForm.formState.errors.phone?.message}
            {...whatsappForm.register('phone', {
              required: 'Введите номер телефона',
            })}
          />
          <Button type="submit" variant="whatsapp" className="w-full" size="lg" isLoading={isSubmitting}>
            <MessageCircle className="h-4 w-4" />
            Отправить код
          </Button>
        </form>
      )}

      {activeTab === 'whatsapp' && otpSent && (
        <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
          <p className="text-center text-sm text-slate-600">
            Код отправлен на <span className="font-medium">{whatsappPhone}</span>
          </p>
          <Input
            id="otp-code"
            label="Код подтверждения"
            type="text"
            placeholder="Введите код"
            maxLength={6}
            error={otpForm.formState.errors.code?.message}
            {...otpForm.register('code', {
              required: 'Введите код',
              minLength: { value: 4, message: 'Введите полный код' },
            })}
          />
          <Button type="submit" variant="whatsapp" className="w-full" size="lg" isLoading={isSubmitting}>
            Подтвердить
          </Button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); otpForm.reset(); }}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700"
          >
            Изменить номер
          </button>
        </form>
      )}

      {/* Register link */}
      <div className="mt-6 text-center text-sm text-slate-600">
        Нет аккаунта?{' '}
        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-700">
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}
