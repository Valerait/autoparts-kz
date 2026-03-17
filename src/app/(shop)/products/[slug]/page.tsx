import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ShoppingCart, MessageCircle, Package, Truck, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/Badge';
import { formatPrice } from '@/utils/format';
import { AddToCartButton } from './AddToCartButton';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      brand: true,
      category: {
        include: {
          parent: true,
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' },
      },
      attributes: true,
      catalogNumbers: true,
      vehicleApps: {
        include: {
          vehicleYear: {
            include: {
              model: {
                include: {
                  make: true,
                },
              },
            },
          },
        },
      },
      analoguesOf: {
        include: {
          analogue: {
            include: {
              brand: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Товар не найден' };

  const title = product.metaTitle || `${product.name} ${product.brand.name} — купить`;
  const description =
    product.metaDesc ||
    product.shortDescription ||
    `${product.name} от ${product.brand.name}. Артикул: ${product.sku}. ${product.price ? formatPrice(Number(product.price)) : 'Цена по запросу'}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];
  const inStock = product.quantity > 0;
  const price = product.price ? Number(product.price) : null;
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null;

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+79001234567';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Здравствуйте! Интересует запчасть: ${product.name} (${product.sku})`
  )}`;

  const oemNumbers = product.catalogNumbers.filter((c) => c.numberType === 'OEM');
  const crossNumbers = product.catalogNumbers.filter((c) => c.numberType === 'CROSS');

  // Group vehicle applications by make > model
  const vehicleGroups: Record<string, { make: string; model: string; years: number[] }> = {};
  for (const app of product.vehicleApps) {
    const key = `${app.vehicleYear.model.make.name} ${app.vehicleYear.model.name}`;
    if (!vehicleGroups[key]) {
      vehicleGroups[key] = {
        make: app.vehicleYear.model.make.name,
        model: app.vehicleYear.model.name,
        years: [],
      };
    }
    vehicleGroups[key].years.push(app.vehicleYear.year);
  }
  Object.values(vehicleGroups).forEach((g) => g.years.sort((a, b) => a - b));

  const analogues = product.analoguesOf.map((a) => ({
    id: a.analogue.id,
    name: a.analogue.name,
    slug: a.analogue.slug,
    sku: a.analogue.sku,
    price: a.analogue.price ? Number(a.analogue.price) : null,
    quantity: a.analogue.quantity,
    isOnOrder: a.analogue.isOnOrder,
    brand: { name: a.analogue.brand.name, slug: a.analogue.brand.slug },
    image: a.analogue.images[0]?.url || null,
    matchType: 'analogue' as const,
  }));

  // Schema.org JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.shortDescription,
    sku: product.sku,
    image: product.images.map((i) => i.url),
    brand: {
      '@type': 'Brand',
      name: product.brand.name,
    },
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'RUB',
        availability: inStock
          ? 'https://schema.org/InStock'
          : product.isOnOrder
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/OutOfStock',
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
          <Link href="/" className="hover:text-primary-600">Главная</Link>
          <ChevronRight className="h-3 w-3" />
          {product.category.parent && (
            <>
              <Link
                href={`/categories/${product.category.parent.slug}`}
                className="hover:text-primary-600"
              >
                {product.category.parent.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          )}
          <Link
            href={`/categories/${product.category.slug}`}
            className="hover:text-primary-600"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="truncate text-slate-900">{product.name}</span>
        </nav>

        {/* Main section */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Images */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt || product.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300">
                  <Package className="h-24 w-24" />
                </div>
              )}
            </div>

            {/* Thumbnail gallery */}
            {product.images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <div
                    key={img.id}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || product.name}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <div className="mb-2">
              <Link
                href={`/brands/${product.brand.slug}`}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {product.brand.name}
              </Link>
            </div>

            <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {product.name}
            </h1>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>Арт: <strong className="text-slate-700">{product.sku}</strong></span>
              {product.unit && <span>Ед: {product.unit}</span>}
            </div>

            {/* Price */}
            <div className="mb-4">
              {price ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-slate-900">{formatPrice(price)}</span>
                  {comparePrice && comparePrice > price && (
                    <span className="text-lg text-slate-400 line-through">{formatPrice(comparePrice)}</span>
                  )}
                </div>
              ) : (
                <span className="text-xl font-semibold text-accent-600">Цена по запросу</span>
              )}
            </div>

            {/* Availability */}
            <div className="mb-6">
              {inStock ? (
                <Badge variant="success">
                  <span className="mr-1">✓</span> В наличии ({product.quantity} {product.unit})
                </Badge>
              ) : product.isOnOrder ? (
                <Badge variant="warning">
                  <Truck className="mr-1 h-3 w-3" /> Под заказ
                </Badge>
              ) : (
                <Badge variant="danger">Нет в наличии</Badge>
              )}
            </div>

            {/* Actions */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton
                productId={product.id}
                disabled={!inStock && !product.isOnOrder}
              />
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 py-3 font-medium text-white transition-colors hover:bg-green-600"
              >
                <MessageCircle className="h-5 w-5" />
                Написать в WhatsApp
              </a>
            </div>

            {/* Short description */}
            {product.shortDescription && (
              <p className="mb-6 text-sm leading-relaxed text-slate-600">
                {product.shortDescription}
              </p>
            )}

            {/* Attributes */}
            {product.attributes.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Характеристики</h2>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <tbody>
                      {product.attributes.map((attr, i) => (
                        <tr key={attr.id} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="px-4 py-2 font-medium text-slate-600">{attr.name}</td>
                          <td className="px-4 py-2 text-slate-900">{attr.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Catalog numbers */}
            {(oemNumbers.length > 0 || crossNumbers.length > 0) && (
              <div className="mb-6">
                <h2 className="mb-3 text-lg font-semibold text-slate-900">Каталожные номера</h2>
                {oemNumbers.length > 0 && (
                  <div className="mb-3">
                    <h3 className="mb-1.5 text-sm font-medium text-slate-600">OEM номера</h3>
                    <div className="flex flex-wrap gap-2">
                      {oemNumbers.map((n) => (
                        <span key={n.id} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-700">
                          {n.originalNumber}
                          {n.brandName && <span className="ml-1 text-slate-400">({n.brandName})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {crossNumbers.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-sm font-medium text-slate-600">Кросс-номера</h3>
                    <div className="flex flex-wrap gap-2">
                      {crossNumbers.map((n) => (
                        <span key={n.id} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-mono text-blue-700">
                          {n.originalNumber}
                          {n.brandName && <span className="ml-1 text-blue-400">({n.brandName})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Full description */}
        {product.description && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Описание</h2>
            <div className="prose max-w-none text-slate-600">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          </div>
        )}

        {/* Vehicle applications */}
        {Object.keys(vehicleGroups).length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Применимость</h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Марка</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Модель</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600">Годы выпуска</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(vehicleGroups).map((group, i) => (
                    <tr key={`${group.make}-${group.model}`} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-4 py-2 font-medium text-slate-900">{group.make}</td>
                      <td className="px-4 py-2 text-slate-700">{group.model}</td>
                      <td className="px-4 py-2 text-slate-500">
                        {group.years.length > 2
                          ? `${group.years[0]}–${group.years[group.years.length - 1]}`
                          : group.years.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analogues */}
        {analogues.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">Аналоги</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {analogues.map((analogue) => (
                <ProductCard key={analogue.id} product={analogue} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// We need ProductCard as a client import for analogues section
import { ProductCard } from '@/components/shop/ProductCard';
