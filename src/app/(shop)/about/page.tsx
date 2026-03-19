import Link from 'next/link';
import { ChevronRight, Truck, Shield, Clock, Award, Phone, MessageCircle, MapPin } from 'lucide-react';
import { getContent } from '@/lib/content';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'О компании — АвтоЗапчасти КЗ',
  description: 'Интернет-магазин автозапчастей в Казахстане. Широкий ассортимент оригинальных и аналоговых запчастей с доставкой по всей стране.',
};

interface AboutContent {
  title: string;
  intro: string;
  advantages: { title: string; desc: string }[];
}

const ICONS = [Truck, Shield, Clock, Award];

export default async function AboutPage() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+77001234567';
  const about = await getContent<AboutContent>('about');

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">{about.title}</span>
      </nav>

      <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">{about.title}</h1>

      <div className="prose prose-slate max-w-none">
        <p className="text-lg text-slate-600 leading-relaxed">{about.intro}</p>
      </div>

      {/* Advantages */}
      {about.advantages && about.advantages.length > 0 && (
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {about.advantages.map((item, i) => {
            const Icon = ICONS[i] || Award;
            return (
              <div key={i} className="flex gap-4 rounded-xl border border-slate-200 p-5">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact block */}
      <div className="mt-10 rounded-2xl bg-slate-50 p-6">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Свяжитесь с нами</h2>
        <div className="flex flex-col gap-3">
          <a
            href={`tel:${whatsappNumber}`}
            className="flex items-center gap-3 text-slate-700 hover:text-primary-600"
          >
            <Phone className="h-5 w-5 text-primary-600" />
            <span>{whatsappNumber}</span>
          </a>
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-green-600 hover:text-green-700"
          >
            <MessageCircle className="h-5 w-5" />
            <span>Написать в WhatsApp</span>
          </a>
          <div className="flex items-center gap-3 text-slate-700">
            <MapPin className="h-5 w-5 text-primary-600" />
            <span>Казахстан</span>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
          >
            Контакты
          </Link>
        </div>
      </div>
    </div>
  );
}
