'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShoppingCart, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatPrice } from '@/utils/format';

interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  comment?: string;
  contactMethod: 'phone' | 'whatsapp' | 'email';
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, fetchUser } = useAuth();
  const { items, isLoading: cartLoading, fetchCart, totalAmount } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryAddress: '',
      comment: '',
      contactMethod: 'whatsapp',
    },
  });

  useEffect(() => {
    fetchUser();
    fetchCart();
  }, [fetchUser, fetchCart]);

  // Redirect to login if not authenticated (after loading completes)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (items.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || undefined,
          deliveryAddress: data.deliveryAddress || undefined,
          comment: data.comment || undefined,
          contactMethod: data.contactMethod,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        const number = result.data?.orderNumber || result.data?.id || 'N/A';
        setOrderNumber(number);
        // Clear cart after successful order
        await fetchCart();
        toast.success('Заказ успешно оформлен!');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Ошибка при оформлении заказа');
      }
    } catch {
      toast.error('Произошла ошибка. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || cartLoading) {
    return (
      <div className="container-main py-12">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Order success
  if (orderNumber) {
    return (
      <div className="container-main py-12">
        <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
          <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Заказ оформлен!</h1>
          <p className="mb-2 text-slate-600">
            Номер вашего заказа:
          </p>
          <p className="mb-6 text-xl font-bold text-primary-600">
            {orderNumber}
          </p>
          <p className="mb-8 text-sm text-slate-500">
            Мы свяжемся с вами для подтверждения заказа. Доставка по всему Казахстану.
          </p>
          <div className="flex gap-3">
            <Link href="/search">
              <Button variant="outline">Продолжить покупки</Button>
            </Link>
            <Link href="/">
              <Button>На главную</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="container-main py-12">
        <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
          <ShoppingCart className="mb-4 h-16 w-16 text-slate-300" />
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Корзина пуста</h1>
          <p className="mb-6 text-slate-500">
            Добавьте товары в корзину перед оформлением заказа
          </p>
          <Link href="/search">
            <Button size="lg">Перейти к каталогу</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-main py-8 md:py-12">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 md:text-3xl">Оформление заказа</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)} id="checkout-form" className="space-y-6">
            {/* Contact info */}
            <div className="rounded-xl border border-slate-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Контактные данные</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  id="customerName"
                  label="Имя *"
                  placeholder="Ваше имя"
                  error={errors.customerName?.message}
                  {...register('customerName', {
                    required: 'Укажите имя',
                    minLength: { value: 2, message: 'Минимум 2 символа' },
                  })}
                />
                <Input
                  id="customerPhone"
                  label="Телефон *"
                  placeholder="+7 xxx xxx xx xx"
                  error={errors.customerPhone?.message}
                  {...register('customerPhone', {
                    required: 'Укажите телефон',
                    pattern: {
                      value: /^\+?7[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/,
                      message: 'Формат: +7 xxx xxx xx xx',
                    },
                  })}
                />
                <Input
                  id="customerEmail"
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  error={errors.customerEmail?.message}
                  {...register('customerEmail', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Введите корректный email',
                    },
                  })}
                />
                <div className="w-full">
                  <label
                    htmlFor="contactMethod"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Предпочтительный способ связи
                  </label>
                  <select
                    id="contactMethod"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('contactMethod')}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="phone">Телефонный звонок</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-xl border border-slate-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Доставка</h2>
              <p className="mb-4 text-sm text-slate-500">
                Доставка по всему Казахстану. Стоимость доставки рассчитывается индивидуально.
              </p>
              <Input
                id="deliveryAddress"
                label="Адрес доставки"
                placeholder="Город, улица, дом, квартира"
                error={errors.deliveryAddress?.message}
                {...register('deliveryAddress')}
              />
            </div>

            {/* Comment */}
            <div className="rounded-xl border border-slate-200 p-6">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Комментарий</h2>
              <div className="w-full">
                <textarea
                  id="comment"
                  rows={3}
                  placeholder="Дополнительные пожелания к заказу..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  {...register('comment')}
                />
              </div>
            </div>

            {/* Submit (mobile) */}
            <div className="lg:hidden">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Подтвердить заказ
              </Button>
            </div>
          </form>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-xl border border-slate-200 p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Ваш заказ</h2>

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {item.product.images?.[0]?.url ? (
                      <img
                        src={item.product.images[0].url}
                        alt={item.product.name}
                        className="h-full w-full object-contain p-0.5"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-slate-900">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.quantity} x {formatPrice(item.product.price)}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-sm font-medium text-slate-900">
                    {formatPrice(
                      item.product.price != null
                        ? item.product.price * item.quantity
                        : null
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Товары ({items.length})</span>
                <span className="text-sm font-medium text-slate-900">
                  {formatPrice(totalAmount())}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-slate-600">Доставка</span>
                <span className="text-sm text-slate-500">рассчитывается отдельно</span>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-900">Итого</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatPrice(totalAmount())}
                </span>
              </div>
            </div>

            {/* Submit (desktop) */}
            <div className="mt-6 hidden lg:block">
              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Подтвердить заказ
              </Button>
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Нажимая кнопку, вы соглашаетесь с условиями обработки данных
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
