import { prisma } from '@/lib/prisma';
import { SearchBox } from '@/components/shop/SearchBox';
import { VehicleSelector } from '@/components/shop/VehicleSelector';
import Link from 'next/link';
import { MessageCircle, Truck, Shield, Clock, Award } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'АвтоЗапчасти — Интернет-магазин автозапчастей в Казахстане',
  description: 'Интернет-магазин оригинальных и аналоговых автозапчастей в Казахстане. Быстрый поиск по каталожному номеру, OEM, кросс-номерам. Доставка по всему Казахстану.',
};

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
    // DB not available — return empty data gracefully
    return { categories: [], brands: [] };
  }
}

export default async function HomePage() {
  const { categories, brands } = await getHomeData();
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+79001234567';

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white">
        <div className="container-main py-12 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold md:text-5xl">
              Найдите нужную запчасть <span className="text-accent-400">за секунды</span>
            </h1>
            <p className="mb-8 text-lg text-primary-200">
              Поиск по каталожному номеру, OEM, артикулу или названию
            </p>
            <div className="flex justify-center">
              <SearchBox large placeholder="Введите каталожный номер, например: 04152-YZZA1" />
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
          {[
            { icon: Truck, title: 'Быстрая доставка', desc: 'По всему Казахстану' },
            { icon: Shield, title: 'Гарантия качества', desc: 'Оригинальные запчасти' },
            { icon: Clock, title: 'Работаем 24/7', desc: 'Онлайн заказы' },
            { icon: Award, title: '10 000+ товаров', desc: 'В каталоге' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center rounded-lg border border-slate-200 p-4 text-center">
              <Icon className="mb-2 h-8 w-8 text-primary-600" />
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="container-main pb-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Популярные категории</h2>
            <Link href="/categories/all" className="text-sm text-primary-600 hover:text-primary-700">
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
              <Link href="/brands/all" className="text-sm text-primary-600 hover:text-primary-700">
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
              <h2 className="mb-2 text-2xl font-bold">Не нашли нужную запчасть?</h2>
              <p className="text-green-100">Напишите нам в WhatsApp — поможем подобрать деталь по VIN или описанию</p>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Здравствуйте! Помогите подобрать запчасть.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-xl bg-white px-8 py-3 font-semibold text-green-600 transition-transform hover:scale-105"
            >
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
