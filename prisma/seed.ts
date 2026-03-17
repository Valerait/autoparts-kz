import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

function normalizePartNumber(input: string): string {
  return input.trim().toUpperCase().replace(/[\s\-\.\/_\\,;:()]/g, '');
}

async function main() {
  console.log('🌱 Seeding database...');

  // =========================================================================
  // ADMIN USER
  // =========================================================================
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { phone: '+79001234567' },
    update: {},
    create: {
      phone: '+79001234567',
      passwordHash: adminPassword,
      name: 'Администратор',
      role: 'ADMIN',
      phoneVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.phone);

  // Manager
  const managerPassword = await hash('manager123', 12);
  const manager = await prisma.user.upsert({
    where: { phone: '+79001234568' },
    update: {},
    create: {
      phone: '+79001234568',
      passwordHash: managerPassword,
      name: 'Менеджер Иван',
      role: 'MANAGER',
      phoneVerified: true,
    },
  });
  console.log('✅ Manager user created:', manager.phone);

  // Customer
  const customerPassword = await hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { phone: '+79001234569' },
    update: {},
    create: {
      phone: '+79001234569',
      passwordHash: customerPassword,
      name: 'Алексей Петров',
      role: 'CUSTOMER',
      phoneVerified: true,
    },
  });
  console.log('✅ Customer user created:', customer.phone);

  // =========================================================================
  // BRANDS
  // =========================================================================
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { slug: 'toyota' }, update: {}, create: { name: 'Toyota', slug: 'toyota', description: 'Оригинальные запчасти Toyota', sortOrder: 1 } }),
    prisma.brand.upsert({ where: { slug: 'hyundai' }, update: {}, create: { name: 'Hyundai', slug: 'hyundai', description: 'Оригинальные запчасти Hyundai/Kia', sortOrder: 2 } }),
    prisma.brand.upsert({ where: { slug: 'mann-filter' }, update: {}, create: { name: 'MANN-FILTER', slug: 'mann-filter', description: 'Фильтры MANN', sortOrder: 3 } }),
    prisma.brand.upsert({ where: { slug: 'bosch' }, update: {}, create: { name: 'Bosch', slug: 'bosch', description: 'Запчасти Bosch', sortOrder: 4 } }),
    prisma.brand.upsert({ where: { slug: 'denso' }, update: {}, create: { name: 'Denso', slug: 'denso', description: 'Запчасти Denso', sortOrder: 5 } }),
    prisma.brand.upsert({ where: { slug: 'ngk' }, update: {}, create: { name: 'NGK', slug: 'ngk', description: 'Свечи зажигания NGK', sortOrder: 6 } }),
    prisma.brand.upsert({ where: { slug: 'sachs' }, update: {}, create: { name: 'Sachs', slug: 'sachs', description: 'Амортизаторы и сцепление Sachs', sortOrder: 7 } }),
    prisma.brand.upsert({ where: { slug: 'lemforder' }, update: {}, create: { name: 'Lemförder', slug: 'lemforder', description: 'Рулевое и подвеска', sortOrder: 8 } }),
  ]);
  console.log(`✅ ${brands.length} brands created`);

  // =========================================================================
  // CATEGORIES
  // =========================================================================
  const catEngine = await prisma.category.upsert({ where: { slug: 'engine' }, update: {}, create: { name: 'Двигатель', slug: 'engine', description: 'Запчасти для двигателя', sortOrder: 1 } });
  const catFilters = await prisma.category.upsert({ where: { slug: 'filters' }, update: {}, create: { name: 'Фильтры', slug: 'filters', description: 'Масляные, воздушные, топливные, салонные фильтры', parentId: catEngine.id, sortOrder: 1 } });
  const catIgnition = await prisma.category.upsert({ where: { slug: 'ignition' }, update: {}, create: { name: 'Зажигание', slug: 'ignition', description: 'Свечи зажигания, катушки, провода', parentId: catEngine.id, sortOrder: 2 } });
  const catSuspension = await prisma.category.upsert({ where: { slug: 'suspension' }, update: {}, create: { name: 'Подвеска', slug: 'suspension', description: 'Амортизаторы, пружины, рычаги', sortOrder: 2 } });
  const catBrakes = await prisma.category.upsert({ where: { slug: 'brakes' }, update: {}, create: { name: 'Тормозная система', slug: 'brakes', description: 'Тормозные колодки, диски, суппорты', sortOrder: 3 } });
  const catBody = await prisma.category.upsert({ where: { slug: 'body' }, update: {}, create: { name: 'Кузов', slug: 'body', description: 'Кузовные детали', sortOrder: 4 } });
  const catElectrical = await prisma.category.upsert({ where: { slug: 'electrical' }, update: {}, create: { name: 'Электрика', slug: 'electrical', description: 'Стартеры, генераторы, датчики', sortOrder: 5 } });

  console.log('✅ Categories created');

  // =========================================================================
  // VEHICLES
  // =========================================================================
  const makeToyota = await prisma.vehicleMake.upsert({ where: { slug: 'toyota' }, update: {}, create: { name: 'Toyota', slug: 'toyota' } });
  const makeHyundai = await prisma.vehicleMake.upsert({ where: { slug: 'hyundai' }, update: {}, create: { name: 'Hyundai', slug: 'hyundai' } });
  const makeKia = await prisma.vehicleMake.upsert({ where: { slug: 'kia' }, update: {}, create: { name: 'Kia', slug: 'kia' } });

  const modelCamry = await prisma.vehicleModel.upsert({ where: { makeId_slug: { makeId: makeToyota.id, slug: 'camry' } }, update: {}, create: { name: 'Camry', slug: 'camry', makeId: makeToyota.id } });
  const modelCorolla = await prisma.vehicleModel.upsert({ where: { makeId_slug: { makeId: makeToyota.id, slug: 'corolla' } }, update: {}, create: { name: 'Corolla', slug: 'corolla', makeId: makeToyota.id } });
  const modelSolaris = await prisma.vehicleModel.upsert({ where: { makeId_slug: { makeId: makeHyundai.id, slug: 'solaris' } }, update: {}, create: { name: 'Solaris', slug: 'solaris', makeId: makeHyundai.id } });
  const modelRio = await prisma.vehicleModel.upsert({ where: { makeId_slug: { makeId: makeKia.id, slug: 'rio' } }, update: {}, create: { name: 'Rio', slug: 'rio', makeId: makeKia.id } });

  // Years
  const years: { modelId: string; year: number }[] = [];
  for (const model of [modelCamry, modelCorolla, modelSolaris, modelRio]) {
    for (let y = 2018; y <= 2024; y++) {
      years.push({ modelId: model.id, year: y });
    }
  }
  for (const y of years) {
    await prisma.vehicleYear.upsert({
      where: { modelId_year: { modelId: y.modelId, year: y.year } },
      update: {},
      create: y,
    });
  }
  console.log('✅ Vehicles created');

  // =========================================================================
  // WAREHOUSE
  // =========================================================================
  const warehouse = await prisma.warehouse.upsert({
    where: { id: 'main-warehouse' },
    update: {},
    create: { id: 'main-warehouse', name: 'Основной склад', address: 'г. Москва, ул. Складская, д.1' },
  });

  // =========================================================================
  // PRODUCTS
  // =========================================================================
  const productsData = [
    {
      name: 'Фильтр масляный Toyota 04152-YZZA1',
      sku: '04152-YZZA1',
      brandSlug: 'toyota',
      categoryId: catFilters.id,
      price: 850,
      quantity: 25,
      description: 'Оригинальный масляный фильтр Toyota для двигателей серии 2AR-FE, 1AR-FE. Подходит для Toyota Camry, RAV4, Highlander.',
      catalogNumbers: [
        { original: '04152-YZZA1', type: 'OEM', brand: 'Toyota' },
        { original: '04152-31090', type: 'OEM', brand: 'Toyota' },
        { original: '04152-YZZA5', type: 'CROSS', brand: 'Toyota' },
      ],
      vehicles: ['camry', 'corolla'],
    },
    {
      name: 'Фильтр масляный MANN W 712/95',
      sku: 'W712-95',
      brandSlug: 'mann-filter',
      categoryId: catFilters.id,
      price: 520,
      quantity: 40,
      description: 'Масляный фильтр MANN-FILTER. Аналог Toyota 04152-YZZA1. Высокое качество фильтрации.',
      catalogNumbers: [
        { original: 'W 712/95', type: 'OEM', brand: 'MANN-FILTER' },
        { original: 'W712/95', type: 'ALIAS', brand: 'MANN-FILTER' },
      ],
      vehicles: ['camry'],
    },
    {
      name: 'Свеча зажигания NGK BKR6EYA-11',
      sku: 'BKR6EYA-11',
      brandSlug: 'ngk',
      categoryId: catIgnition.id,
      price: 320,
      quantity: 100,
      description: 'Свеча зажигания NGK. Подходит для Toyota, Hyundai, Kia. V-Line серия.',
      catalogNumbers: [
        { original: 'BKR6EYA-11', type: 'OEM', brand: 'NGK' },
        { original: '4073', type: 'ALIAS', brand: 'NGK' },
        { original: '90919-01253', type: 'CROSS', brand: 'Toyota' },
      ],
      vehicles: ['camry', 'corolla', 'solaris'],
    },
    {
      name: 'Колодки тормозные передние Bosch 0 986 494 664',
      sku: '0986494664',
      brandSlug: 'bosch',
      categoryId: catBrakes.id,
      price: 2800,
      quantity: 15,
      description: 'Передние тормозные колодки Bosch для Hyundai Solaris, Kia Rio. Серия QuietCast.',
      catalogNumbers: [
        { original: '0 986 494 664', type: 'OEM', brand: 'Bosch' },
        { original: '58101-H5A00', type: 'CROSS', brand: 'Hyundai' },
      ],
      vehicles: ['solaris', 'rio'],
    },
    {
      name: 'Амортизатор передний Sachs 314 718',
      sku: '314718',
      brandSlug: 'sachs',
      categoryId: catSuspension.id,
      price: 5200,
      quantity: 8,
      description: 'Передний газовый амортизатор Sachs для Toyota Camry XV50/XV70.',
      catalogNumbers: [
        { original: '314 718', type: 'OEM', brand: 'Sachs' },
        { original: '48510-09U50', type: 'CROSS', brand: 'Toyota' },
      ],
      vehicles: ['camry'],
    },
    {
      name: 'Фильтр воздушный Toyota 17801-21060',
      sku: '17801-21060',
      brandSlug: 'toyota',
      categoryId: catFilters.id,
      price: 950,
      quantity: 30,
      description: 'Оригинальный воздушный фильтр для Toyota Corolla, Auris.',
      catalogNumbers: [
        { original: '17801-21060', type: 'OEM', brand: 'Toyota' },
        { original: '17801-0D060', type: 'CROSS', brand: 'Toyota' },
      ],
      vehicles: ['corolla'],
    },
    {
      name: 'Свеча зажигания Denso K20TT',
      sku: 'K20TT',
      brandSlug: 'denso',
      categoryId: catIgnition.id,
      price: 280,
      quantity: 0,
      isOnOrder: true,
      description: 'Свеча зажигания Denso Twin Tip. Увеличенный ресурс.',
      catalogNumbers: [
        { original: 'K20TT', type: 'OEM', brand: 'Denso' },
        { original: '4604', type: 'ALIAS', brand: 'Denso' },
      ],
      vehicles: ['camry', 'corolla'],
    },
    {
      name: 'Колодки тормозные задние Hyundai 58302-H5A00',
      sku: '58302-H5A00',
      brandSlug: 'hyundai',
      categoryId: catBrakes.id,
      price: null,
      isOnOrder: true,
      quantity: 0,
      description: 'Оригинальные задние тормозные колодки для Hyundai Solaris II, Kia Rio IV.',
      catalogNumbers: [
        { original: '58302-H5A00', type: 'OEM', brand: 'Hyundai' },
        { original: '58302H5A00', type: 'ALIAS', brand: 'Hyundai' },
      ],
      vehicles: ['solaris', 'rio'],
    },
  ];

  const brandMap = new Map(brands.map((b) => [b.slug, b]));
  const vehicleModelMap: Record<string, typeof modelCamry> = { camry: modelCamry, corolla: modelCorolla, solaris: modelSolaris, rio: modelRio };

  const createdProducts: any[] = [];

  for (const pd of productsData) {
    const brand = brandMap.get(pd.brandSlug)!;
    const slug = pd.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const product = await prisma.product.upsert({
      where: { sku: pd.sku },
      update: {
        name: pd.name,
        price: pd.price ?? undefined,
        quantity: pd.quantity,
        isOnOrder: pd.isOnOrder ?? false,
      },
      create: {
        name: pd.name,
        slug,
        sku: pd.sku,
        brandId: brand.id,
        categoryId: pd.categoryId,
        description: pd.description,
        price: pd.price ?? undefined,
        quantity: pd.quantity,
        isOnOrder: pd.isOnOrder ?? false,
      },
    });

    createdProducts.push(product);

    // Catalog numbers
    for (const cn of pd.catalogNumbers) {
      const normalized = normalizePartNumber(cn.original);
      await prisma.catalogNumber.upsert({
        where: { id: `${product.id}-${normalized}` },
        update: {},
        create: {
          id: `${product.id}-${normalized}`,
          productId: product.id,
          originalNumber: cn.original,
          normalizedNumber: normalized,
          numberType: cn.type,
          brandName: cn.brand,
        },
      });
    }

    // Vehicle applications
    if (pd.vehicles) {
      for (const vSlug of pd.vehicles) {
        const model = vehicleModelMap[vSlug];
        if (!model) continue;
        const vehicleYears = await prisma.vehicleYear.findMany({ where: { modelId: model.id } });
        for (const vy of vehicleYears.slice(0, 3)) {
          await prisma.vehicleApplication.upsert({
            where: { productId_vehicleYearId: { productId: product.id, vehicleYearId: vy.id } },
            update: {},
            create: { productId: product.id, vehicleYearId: vy.id },
          });
        }
      }
    }

    // Warehouse stock
    await prisma.warehouseStock.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: warehouse.id } },
      update: { quantity: pd.quantity },
      create: { productId: product.id, warehouseId: warehouse.id, quantity: pd.quantity },
    });
  }

  // =========================================================================
  // ANALOGUES
  // =========================================================================
  // MANN filter is analogue of Toyota oil filter
  if (createdProducts.length >= 2) {
    await prisma.productAnalogue.upsert({
      where: { originalId_analogueId: { originalId: createdProducts[0].id, analogueId: createdProducts[1].id } },
      update: {},
      create: { originalId: createdProducts[0].id, analogueId: createdProducts[1].id, analogueType: 'ANALOGUE' },
    });
    // Bidirectional
    await prisma.productAnalogue.upsert({
      where: { originalId_analogueId: { originalId: createdProducts[1].id, analogueId: createdProducts[0].id } },
      update: {},
      create: { originalId: createdProducts[1].id, analogueId: createdProducts[0].id, analogueType: 'ANALOGUE' },
    });
  }

  // NGK and Denso spark plugs are analogues
  if (createdProducts.length >= 7) {
    await prisma.productAnalogue.upsert({
      where: { originalId_analogueId: { originalId: createdProducts[2].id, analogueId: createdProducts[6].id } },
      update: {},
      create: { originalId: createdProducts[2].id, analogueId: createdProducts[6].id, analogueType: 'ANALOGUE' },
    });
  }

  // =========================================================================
  // SAMPLE ORDER
  // =========================================================================
  const order = await prisma.order.upsert({
    where: { orderNumber: 'ORD-2024-001' },
    update: {},
    create: {
      orderNumber: 'ORD-2024-001',
      userId: customer.id,
      status: 'CONFIRMED',
      totalAmount: 1370,
      customerName: 'Алексей Петров',
      customerPhone: '+79001234569',
      contactMethod: 'whatsapp',
      items: {
        create: [
          { productId: createdProducts[0].id, quantity: 1, price: 850, name: createdProducts[0].name, sku: createdProducts[0].sku },
          { productId: createdProducts[1].id, quantity: 1, price: 520, name: createdProducts[1].name, sku: createdProducts[1].sku },
        ],
      },
    },
  });

  await prisma.orderStatusLog.create({
    data: { orderId: order.id, toStatus: 'NEW', changedBy: 'system' },
  });
  await prisma.orderStatusLog.create({
    data: { orderId: order.id, fromStatus: 'NEW', toStatus: 'CONFIRMED', changedBy: admin.id, comment: 'Заказ подтверждён' },
  });

  // Banner
  await prisma.banner.upsert({
    where: { id: 'main-banner' },
    update: {},
    create: {
      id: 'main-banner',
      title: 'Скидки до 30% на фильтры',
      subtitle: 'Только в этом месяце',
      image: '/images/banner-filters.jpg',
      link: '/categories/filters',
      sortOrder: 1,
    },
  });

  console.log('');
  console.log('✅ Seed completed successfully!');
  console.log('');
  console.log('📋 Test accounts:');
  console.log('   Admin:    +79001234567 / admin123');
  console.log('   Manager:  +79001234568 / manager123');
  console.log('   Customer: +79001234569 / customer123');
  console.log('');
  console.log(`📦 Products: ${createdProducts.length}`);
  console.log(`🏷️  Brands: ${brands.length}`);
  console.log(`📂 Categories: 7`);
  console.log(`🚗 Vehicles: Toyota Camry/Corolla, Hyundai Solaris, Kia Rio`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
