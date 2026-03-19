'use client';

import Link from 'next/link';
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FooterContent {
  companyDesc: string;
  email: string;
  address: string;
  copyright: string;
  priceNote: string;
}

const DEFAULT_FOOTER: FooterContent = {
  companyDesc: 'Интернет-магазин автозапчастей в Казахстане. Оригинальные и аналоговые запчасти для всех марок автомобилей.',
  email: 'info@autozapchasti.kz',
  address: 'г. Алматы, ул. Абая, 1',
  copyright: 'АвтоЗапчасти. Все права защищены.',
  priceNote: 'Цены указаны в тенге и носят информационный характер',
};

interface BrandingContent {
  storeNamePrefix: string;
  storeNameAccent: string;
}

const DEFAULT_BRANDING: BrandingContent = {
  storeNamePrefix: 'Авто',
  storeNameAccent: 'Запчасти',
};

export function Footer() {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+79001234567';
  const [footer, setFooter] = useState<FooterContent>(DEFAULT_FOOTER);
  const [branding, setBranding] = useState<BrandingContent>(DEFAULT_BRANDING);

  useEffect(() => {
    fetch('/api/content/footer')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data?.value) setFooter(data.data.value);
      })
      .catch(() => {});
    fetch('/api/content/branding')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.data?.value) setBranding(data.data.value);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="container-main py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company */}
          <div>
            <span className="text-xl font-bold text-white">
              {branding.storeNamePrefix}<span className="text-accent-400">{branding.storeNameAccent}</span>
            </span>
            <p className="mt-3 text-sm text-slate-400">
              {footer.companyDesc}
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-white transition-transform hover:scale-110"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Каталог</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categories" className="hover:text-white">Все категории</Link></li>
              <li><Link href="/brands" className="hover:text-white">Бренды</Link></li>
              <li><Link href="/search" className="hover:text-white">Поиск по номеру</Link></li>
              <li><Link href="/search" className="hover:text-white">Подбор по авто</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Информация</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">О компании</Link></li>
              <li><Link href="/delivery" className="hover:text-white">Доставка и оплата</Link></li>
              <li><Link href="/warranty" className="hover:text-white">Гарантия и возврат</Link></li>
              <li><Link href="/contacts" className="hover:text-white">Контакты</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Контакты</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <a href={`tel:${whatsappNumber}`} className="hover:text-white">{whatsappNumber}</a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 flex-shrink-0 text-whatsapp" />
                <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary-400" />
                <span>{footer.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-primary-400 mt-0.5" />
                <span>{footer.address}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-main flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {footer.copyright}</p>
          <p>{footer.priceNote}</p>
        </div>
      </div>
    </footer>
  );
}
