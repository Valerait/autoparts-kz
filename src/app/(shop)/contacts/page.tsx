import Link from 'next/link';
import { ChevronRight, Phone, MessageCircle, Mail, Clock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Контакты — АвтоЗапчасти КЗ',
  description: 'Контактная информация интернет-магазина автозапчастей в Казахстане. Телефон, WhatsApp, режим работы.',
};

export default function ContactsPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+77001234567';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">Контакты</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">Контакты</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Phone */}
        <a
          href={`tel:${whatsappNumber}`}
          className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Phone className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Телефон</div>
            <div className="mt-1 font-semibold text-slate-900">{whatsappNumber}</div>
            <div className="mt-0.5 text-sm text-slate-500">Звонки, SMS</div>
          </div>
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Здравствуйте! У меня вопрос по заказу.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 rounded-xl border border-green-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-50">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">WhatsApp</div>
            <div className="mt-1 font-semibold text-slate-900">{whatsappNumber}</div>
            <div className="mt-0.5 text-sm text-slate-500">Быстрые ответы</div>
          </div>
        </a>

        {/* Email */}
        <a
          href="mailto:info@autozapchasti.kz"
          className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Email</div>
            <div className="mt-1 font-semibold text-slate-900">info@autozapchasti.kz</div>
            <div className="mt-0.5 text-sm text-slate-500">Для официальных запросов</div>
          </div>
        </a>

        {/* Working hours */}
        <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Clock className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">Режим работы</div>
            <div className="mt-1 font-semibold text-slate-900">Пн–Пт: 9:00–18:00</div>
            <div className="mt-0.5 text-sm text-slate-500">Сб–Вс: заказы принимаются онлайн</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <MessageCircle className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-lg">Не нашли нужную запчасть?</div>
            <div className="text-green-100 text-sm mt-1">Напишите нам — поможем подобрать по VIN или описанию</div>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-xl bg-white px-6 py-2.5 font-semibold text-green-600 hover:bg-green-50 transition-colors"
          >
            Написать в WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
