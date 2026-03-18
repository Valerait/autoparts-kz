import Link from 'next/link';
import { ChevronRight, Truck, CreditCard, Clock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Доставка и оплата — АвтоЗапчасти КЗ',
  description: 'Условия доставки автозапчастей по Казахстану. Способы оплаты. Сроки и стоимость доставки.',
};

export default function DeliveryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">Доставка и оплата</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">Доставка и оплата</h1>

      <div className="space-y-8">
        {/* Delivery section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Truck className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Доставка</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            {[
              { city: 'Алматы', time: '1–2 рабочих дня', price: 'от 500 ₸' },
              { city: 'Астана', time: '2–3 рабочих дня', price: 'от 700 ₸' },
              { city: 'Другие города', time: '3–7 рабочих дней', price: 'по тарифу курьерской службы' },
            ].map(({ city, time, price }) => (
              <div key={city} className="flex items-center justify-between px-5 py-4">
                <div>
                  <div className="font-medium text-slate-900">{city}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {time}
                  </div>
                </div>
                <div className="text-sm font-semibold text-primary-600">{price}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Доставка осуществляется через транспортные компании Казпочта, CDEK, DHL и другие.
            Самовывоз и точный адрес — уточняйте у менеджера.
          </p>
        </section>

        {/* Payment section */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <CreditCard className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Оплата</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Банковская карта', desc: 'Visa, Mastercard, Мир' },
              { title: 'Kaspi Pay', desc: 'Оплата через Kaspi' },
              { title: 'Банковский перевод', desc: 'По реквизитам организации' },
              { title: 'Наличными', desc: 'При получении (для Алматы)' },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="font-medium text-slate-900">{title}</div>
                <div className="text-sm text-slate-500">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Note */}
        <div className="rounded-xl bg-primary-50 p-5 text-sm text-primary-800">
          <MapPin className="mb-2 h-5 w-5" />
          <p>По всем вопросам доставки и оплаты обращайтесь к нашим менеджерам по телефону или WhatsApp.</p>
          <Link href="/contacts" className="mt-3 inline-block font-medium underline hover:no-underline">
            Контакты →
          </Link>
        </div>
      </div>
    </div>
  );
}
