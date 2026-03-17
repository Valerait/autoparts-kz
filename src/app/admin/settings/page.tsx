'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Settings, MessageCircle, Store, Save, RefreshCw } from 'lucide-react';

interface SettingsData {
  whatsapp: {
    provider: string;
    connected: boolean;
    phone: string;
  };
  store: {
    name: string;
    phone: string;
    email: string;
    address: string;
    workingHours: string;
  };
}

interface StoreFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  workingHours: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreFormData>();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const json = await res.json();
          setSettings(json.data);
          if (json.data?.store) {
            reset(json.data.store);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: StoreFormData) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: data }),
      });
      if (res.ok) {
        toast.success('Настройки сохранены');
      } else {
        toast.error('Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Настройки</h1>

      {/* WhatsApp section */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <MessageCircle className="h-5 w-5 text-green-500" />
          <h2 className="font-semibold text-slate-900">WhatsApp интеграция</h2>
        </div>
        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Провайдер</p>
              <p className="mt-1 font-medium text-slate-900">
                {settings?.whatsapp?.provider || 'Не настроен'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Статус</p>
              <div className="mt-1">
                <Badge variant={settings?.whatsapp?.connected ? 'success' : 'danger'}>
                  {settings?.whatsapp?.connected ? 'Подключен' : 'Отключен'}
                </Badge>
              </div>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Номер</p>
              <p className="mt-1 font-medium text-slate-900">
                {settings?.whatsapp?.phone || '—'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Настройки WhatsApp-провайдера конфигурируются через переменные окружения сервера.
          </p>
        </div>
      </div>

      {/* Store info section */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
          <Store className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold text-slate-900">Информация о магазине</h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-4">
            <Input
              label="Название магазина"
              {...register('name')}
              placeholder="AutoParts Store"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Телефон"
                {...register('phone')}
                placeholder="+7 (999) 123-45-67"
              />
              <Input
                label="Email"
                type="email"
                {...register('email')}
                placeholder="info@store.com"
              />
            </div>
            <Input
              label="Адрес"
              {...register('address')}
              placeholder="г. Москва, ул. Примерная, 1"
            />
            <Input
              label="Часы работы"
              {...register('workingHours')}
              placeholder="Пн-Пт: 9:00-18:00, Сб: 10:00-16:00"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" isLoading={saving}>
              <Save className="h-4 w-4" />
              Сохранить
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
