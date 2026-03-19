import Link from 'next/link';
import { ChevronRight, Phone, MessageCircle, Mail, Clock } from 'lucide-react';
import { getContent } from '@/lib/content';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Контакты — АвтоЗапчасти КЗ',
  description: 'Контактная информация интернет-магазина автозапчастей в Казахстане. Телефон, WhatsApp, режим работы.',
};

interface ContactsContent {
  title: string;
  phone: string;
  phoneLabel: string;
  phoneDesc: string;
  whatsappLabel: string;
  whatsappDesc: string;
  email: string;
  emailLabel: string;
  emailDesc: string;
  workingHoursLabel: string;
  workingHours: string;
  workingHoursNote: string;
}

interface WhatsAppCtaContent {
  title: string;
  subtitle: string;
  buttonText: string;
}

export default async function ContactsPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+77001234567';
  const [contacts, whatsappCta] = await Promise.all([
    getContent<ContactsContent>('contacts'),
    getContent<WhatsAppCtaContent>('whatsappCta'),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">{contacts.title}</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">{contacts.title}</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Phone */}
        <a
          href={`tel:${contacts.phone || whatsappNumber}`}
          className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Phone className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{contacts.phoneLabel}</div>
            <div className="mt-1 font-semibold text-slate-900">{contacts.phone || whatsappNumber}</div>
            <div className="mt-0.5 text-sm text-slate-500">{contacts.phoneDesc}</div>
          </div>
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/${(contacts.phone || whatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent('Здравствуйте! У меня вопрос по заказу.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 rounded-xl border border-green-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-green-50">
            <MessageCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{contacts.whatsappLabel}</div>
            <div className="mt-1 font-semibold text-slate-900">{contacts.phone || whatsappNumber}</div>
            <div className="mt-0.5 text-sm text-slate-500">{contacts.whatsappDesc}</div>
          </div>
        </a>

        {/* Email */}
        <a
          href={`mailto:${contacts.email}`}
          className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Mail className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{contacts.emailLabel}</div>
            <div className="mt-1 font-semibold text-slate-900">{contacts.email}</div>
            <div className="mt-0.5 text-sm text-slate-500">{contacts.emailDesc}</div>
          </div>
        </a>

        {/* Working hours */}
        <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
            <Clock className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{contacts.workingHoursLabel}</div>
            <div className="mt-1 font-semibold text-slate-900">{contacts.workingHours}</div>
            <div className="mt-0.5 text-sm text-slate-500">{contacts.workingHoursNote}</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <MessageCircle className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-bold text-lg">{whatsappCta.title}</div>
            <div className="text-green-100 text-sm mt-1">{whatsappCta.subtitle}</div>
          </div>
          <a
            href={`https://wa.me/${(contacts.phone || whatsappNumber).replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-xl bg-white px-6 py-2.5 font-semibold text-green-600 hover:bg-green-50 transition-colors"
          >
            {whatsappCta.buttonText}
          </a>
        </div>
      </div>
    </div>
  );
}
