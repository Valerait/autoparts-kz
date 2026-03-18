import Link from 'next/link';
import { ChevronRight, Truck, CreditCard, Clock, MapPin } from 'lucide-react';
import { getContent } from '@/lib/content';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка и оплата — АвтоЗапчасти КЗ',
  description: 'Условия доставки автозапчастей по Казахстану. Способы оплаты. Сроки и стоимость доставки.',
};

interface DeliveryContent {
  title: string;
  deliveryTitle: string;
  deliveryItems: { city: string; time: string; price: string }[];
  deliveryNote: string;
  paymentTitle: string;
  paymentItems: { name: string; desc: string }[];
  paymentNote: string;
}

export default async function DeliveryPage() {
  const delivery = await getContent<DeliveryContent>('delivery');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">{delivery.title}</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">{delivery.title}</h1>

      <div className="space-y-8">
        {/* Delivery section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Truck className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{delivery.deliveryTitle}</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {(delivery.deliveryItems || []).map((item, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-medium text-slate-900">{item.city}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {item.time}
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary-600">{item.price}</div>
              </div>
            ))}
          </div>
          {delivery.deliveryNote && (
            <p className="mt-3 text-sm text-slate-500">{delivery.deliveryNote}</p>
          )}
        </section>

        {/* Payment section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <CreditCard className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{delivery.paymentTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {(delivery.paymentItems || []).map((item, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="text-sm text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Note */}
        {delivery.paymentNote && (
          <div className="rounded-xl bg-primary-50 p-5 text-sm text-primary-800">
            <MapPin className="mb-2 h-5 w-5" />
            <p>{delivery.paymentNote}</p>
            <Link href="/contacts" className="mt-3 inline-block font-medium underline hover:no-underline">
              Контакты →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
