import { prisma } from '@/lib/prisma';
import { getContent } from '@/lib/content';
import { SearchBox } from '@/components/shop/SearchBox';
import { VehicleSelector } from '@/components/shop/VehicleSelector';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle, Truck, Shield, Clock, Award } from 'lucide-react';
import type { Metadata } from 'next';

const FEATURED_PRODUCTS = [
  {
    name: 'Моторное масло',
    desc: 'Синтетика, полусинтетика, минеральное',
    image: '/images/motor-oil.svg',
    badge: 'Хит продаж',
    badgeColor: 'bg-red-500',
    href: '/search?q=моторное+масло',
  },
  {
    name: 'Тормозные колодки',
    desc: 'Передние и задние, все модели авто',
    image: '/images/brake-pads.svg',
    badge: 'Популярное',
    badgeColor: 'bg-orange-500',
    href: '/search?q=тормозные+колодки',
  },
  {
    name: 'Свечи зажигания',
    desc: 'Иридиевые, платиновые, обычные',
    image: '/images/spark-plug.svg',
    badge: 'В наличии',
    badgeColor: 'bg-green-500',
    href: '/search?q=свечи+зажигания',
  },
  {
    name: 'Масляный фильтр',
    desc: 'Оригинальные и аналоговые фильтры',
    image: '/images/oil-filter.svg',
    badge: 'Скидка',
    badgeColor: 'bg-blue-500',
    href: '/search?q=масляный+фильтр',
  },
  {
    name: 'Аккумулятор',
    desc: 'AGM, EFB, обычные — все ёмкости',
    image: '/images/battery.svg',
    badge: 'Популярное',
    badgeColor: 'bg-indigo-500',
    href: '/search?q=аккумулятор',
  },
  {
    name: 'Воздушный фильтр',
    desc: 'Для всех типов двигателей',
    image: '/images/air-filter.svg',
    badge: 'В наличии',
    badgeColor: 'bg-green-500',
    href: '/search?q=воздушный+фильтр',
  },
  {
    name: 'Амортизатор',
    desc: 'Передние и задние стойки',
    image: '/images/shock-absorber.svg',
    badge: 'Топ качество',
    badgeColor: 'bg-purple-500',
    href: '/search?q=амортизатор',
  },
  {
    name: 'Ремень ГРМ',
    desc: 'Комплекты с роликами и помпой',
    image: '/images/timing-belt.svg',
    badge: 'Хит продаж',
    badgeColor: 'bg-red-500',
    href: '/search?q=ремень+грм',
  },
];

export const metadata: Metadata = {
  title: 'АвтоЗапчасти — Интернет-магазин автозапчастей в Казахстане',
  description: 'Интернет-магазин оригинальных и аналоговых автозапчастей в Казахстане. Быстрый поиск по каталожному номеру, OEM, кросс-номерам. Доставка по всему Казахстану.',
};

interface HeroContent {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
}

interface AdvantagesContent {
  items: { title: string; desc: string }[];
}

interface WhatsAppCtaContent {
  title: string;
  subtitle: string;
  buttonText: string;
}

async function getHomeData() {
  try {
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: 'asc' },
        take: 8,
        select: { id: true, name: true, slug: true, image: true },
      }),
      prisma.brand.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        take: 12,
        select: { id: true, name: true, slug: true, logo: true },
      }),
    ]);
    return { categories, brands };
  } catch {
    return { categories: [], brands: [] };
  }
}

const ADVANTAGE_ICONS = [Truck, Shield, Clock, Award];

export default async function HomePage() {
  const [{ categories, brands }, hero, advantages, whatsappCta] = await Promise.all([
    getHomeData(),
    getContent<HeroContent>('hero'),
    getContent<AdvantagesContent>('advantages'),
    getContent<WhatsAppCtaContent>('whatsappCta'),
  ]);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+77001234567';

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white">
        <div className="container-main py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold md:text-5xl">
              {hero.title}
            </h1>
            <p className="mb-8 text-lg text-primary-200">
              {hero.subtitle}
            </p>
            <div className="flex justify-center">
              <SearchBox large placeholder={hero.searchPlaceholder} />
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle Selector */}
      <section className="container-main -mt-6 relative z-10">
        <VehicleSelector />
      </section>

      {/* Advantages */}
      <section className="container-main py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(advantages.items || []).map((item, i) => {
            const Icon = ADVANTAGE_ICONS[i] || Award;
            return (
              <div key={i} className="flex flex-col items-center rounded-lg border border-slate-200 p-4 text-center">
                <Icon className="mb-2 h-8 w-8 text-primary-600" />
                <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-slate-50 py-12">
        <div className="container-main">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Популярные запчасти</h2>
            <p className="mt-2 text-slate-500">Быстрый доступ к самым востребованным категориям</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {FEATURED_PRODUCTS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <div className="mb-4 flex h-24 w-24 items-center justify-center">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain transition-transform group-hover:scale-110"
                  />
                </div>
                <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                <div className="mt-1 text-xs text-slate-500 line-clamp-2">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-main pb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Популярные категории</h2>
            <Link href="/categories" className="text-sm text-primary-600 hover:text-primary-700">
              Все категории →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center rounded-lg border border-slate-200 p-4 text-center transition-shadow hover:shadow-md"
              >
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="mb-3 h-16 w-16 object-contain" />
                ) : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                    <span className="text-2xl font-bold">{cat.name[0]}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-slate-900">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Brands */}
      {brands.length > 0 && (
        <section className="bg-slate-50 py-12">
          <div className="container-main">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Бренды</h2>
              <Link href="/brands" className="text-sm text-primary-600 hover:text-primary-700">
                Все бренды →
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.slug}`}
                  className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="h-10 object-contain" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-700">{brand.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className="container-main py-12">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-green-600 p-8 text-white md:p-12">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <MessageCircle className="h-16 w-16 flex-shrink-0" />
            <div className="flex-1 text-center md:text-left">
              <h2 className="mb-2 text-2xl font-bold">{whatsappCta.title}</h2>
              <p className="text-green-100">{whatsappCta.subtitle}</p>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Здравствуйте! Помогите подобрать запчасть.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-xl bg-white px-8 py-3 font-semibold text-green-600 transition-transform hover:scale-105"
            >
              {whatsappCta.buttonText}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
