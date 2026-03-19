import { prisma } from '@/lib/prisma';

// Default content values (fallback if DB is empty)
const defaults: Record<string, Record<string, unknown>> = {
  branding: {
    storeName: 'АвтоЗапчасти',
    storeNameAccent: 'Запчасти',
    storeNamePrefix: 'Авто',
    tagline: 'Доставка по всему Казахстану',
    metaTitle: 'АвтоЗапчасти — Интернет-магазин автозапчастей в Казахстане',
  },
  hero: {
    title: 'Найдите нужную запчасть за секунды',
    subtitle: 'Поиск по каталожному номеру, OEM, артикулу или названию',
    searchPlaceholder: 'Введите каталожный номер, например: 04152-YZZA1',
  },
  advantages: {
    items: [
      { title: 'Быстрая доставка', desc: 'По всему Казахстану' },
      { title: 'Гарантия качества', desc: 'Оригинальные запчасти' },
      { title: 'Работаем 24/7', desc: 'Онлайн заказы' },
      { title: '10 000+ товаров', desc: 'В каталоге' },
    ],
  },
  whatsappCta: {
    title: 'Не нашли нужную запчасть?',
    subtitle: 'Напишите нам в WhatsApp — поможем подобрать деталь по VIN или описанию',
    buttonText: 'Написать в WhatsApp',
  },
  about: {
    title: 'О компании',
    intro: 'АвтоЗапчасти КЗ — интернет-магазин автозапчастей, работающий на территории Казахстана.',
    advantages: [],
  },
  contacts: {
    title: 'Контакты',
    phone: '+77001234567',
    phoneLabel: 'Телефон',
    phoneDesc: 'Звонки, SMS',
    whatsappLabel: 'WhatsApp',
    whatsappDesc: 'Быстрые ответы',
    email: 'info@autozapchasti.kz',
    emailLabel: 'Email',
    emailDesc: 'Для официальных запросов',
    workingHoursLabel: 'Режим работы',
    workingHours: 'Пн–Пт: 9:00–18:00',
    workingHoursNote: 'Сб–Вс: заказы принимаются онлайн',
  },
  delivery: {
    title: 'Доставка и оплата',
    deliveryTitle: 'Доставка',
    deliveryItems: [],
    deliveryNote: '',
    paymentTitle: 'Оплата',
    paymentItems: [],
    paymentNote: '',
  },
  warranty: {
    title: 'Гарантия и возврат',
    warrantyTitle: 'Гарантия',
    warrantyIntro: '',
    warrantyExclusions: [],
    returnTitle: 'Возврат и обмен',
    returnIntro: '',
    returnConditions: [],
    returnSteps: [],
  },
  footer: {
    companyDesc: 'Интернет-магазин автозапчастей в Казахстане.',
    email: 'info@autozapchasti.kz',
    address: 'г. Алматы, ул. Абая, 1',
    copyright: 'АвтоЗапчасти. Все права защищены.',
    priceNote: 'Цены указаны в тенге и носят информационный характер',
  },
};

export async function getContent<T = Record<string, unknown>>(key: string): Promise<T> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { key } });
    if (row) return row.value as T;
  } catch {
    // fallback to defaults
  }
  return (defaults[key] || {}) as T;
}

export async function getAllContent(): Promise<Record<string, Record<string, unknown>>> {
  try {
    const rows = await prisma.siteContent.findMany();
    const result: Record<string, Record<string, unknown>> = { ...defaults };
    for (const row of rows) {
      result[row.key] = row.value as Record<string, unknown>;
    }
    return result;
  } catch {
    return defaults;
  }
}
