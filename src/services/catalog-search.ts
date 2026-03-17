import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// =============================================================================
// CATALOG NUMBER NORMALIZATION
// =============================================================================

/**
 * Normalizes a catalog/part number for consistent search:
 * - Removes spaces, dashes, dots, slashes
 * - Converts to uppercase
 * - Trims whitespace
 */
export function normalizePartNumber(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s\-\.\/_\\,;:()]/g, '');
}

/**
 * Generates search variations for fuzzy matching
 */
export function generateSearchVariations(input: string): string[] {
  const normalized = normalizePartNumber(input);
  const variations: string[] = [normalized];

  // Without leading zeros
  const noLeadingZeros = normalized.replace(/^0+/, '');
  if (noLeadingZeros !== normalized) variations.push(noLeadingZeros);

  // Original input uppercase (with separators)
  const upper = input.trim().toUpperCase();
  if (upper !== normalized) variations.push(upper);

  return [...new Set(variations)];
}

// =============================================================================
// SEARCH TYPES
// =============================================================================

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
  price: number | null;
  quantity: number;
  isOnOrder: boolean;
  image: string | null;
  matchType: 'exact' | 'oem' | 'cross' | 'analogue' | 'fuzzy' | 'text';
  matchedNumber?: string;
}

export interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  brandId?: string;
  categoryId?: string;
  inStockOnly?: boolean;
}

// =============================================================================
// MAIN SEARCH SERVICE
// =============================================================================

const productSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  quantity: true,
  isOnOrder: true,
  brand: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
  images: { where: { isPrimary: true }, take: 1, select: { url: true } },
} as const;

function mapProduct(product: any, matchType: SearchResult['matchType'], matchedNumber?: string): SearchResult {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    category: product.category,
    price: product.price ? Number(product.price) : null,
    quantity: product.quantity,
    isOnOrder: product.isOnOrder,
    image: product.images?.[0]?.url || null,
    matchType,
    matchedNumber,
  };
}

export async function searchProducts(options: SearchOptions) {
  const { query, page = 1, limit = 20, brandId, categoryId, inStockOnly } = options;
  const offset = (page - 1) * limit;

  if (!query || query.trim().length < 2) {
    return { results: [], total: 0, page, limit };
  }

  const normalized = normalizePartNumber(query);
  const variations = generateSearchVariations(query);
  const results: SearchResult[] = [];
  const seenIds = new Set<string>();

  const baseWhere: Prisma.ProductWhereInput = {
    isActive: true,
    ...(brandId && { brandId }),
    ...(categoryId && { categoryId }),
    ...(inStockOnly && { quantity: { gt: 0 } }),
  };

  // ----- PHASE 1: Exact match by normalized catalog number -----
  const exactMatches = await prisma.catalogNumber.findMany({
    where: {
      normalizedNumber: { in: variations },
      product: baseWhere,
    },
    include: {
      product: { select: productSelect },
    },
    take: limit,
  });

  for (const match of exactMatches) {
    if (!seenIds.has(match.productId)) {
      seenIds.add(match.productId);
      const type = match.numberType === 'OEM' ? 'oem' : match.numberType === 'CROSS' ? 'cross' : 'exact';
      results.push(mapProduct(match.product, type, match.originalNumber));
    }
  }

  // ----- PHASE 2: SKU match -----
  if (results.length < limit) {
    const skuMatch = await prisma.product.findMany({
      where: {
        ...baseWhere,
        sku: { in: variations },
        id: { notIn: [...seenIds] },
      },
      select: productSelect,
      take: limit - results.length,
    });

    for (const product of skuMatch) {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id);
        results.push(mapProduct(product, 'exact', product.sku));
      }
    }
  }

  // ----- PHASE 3: Analogues of found products -----
  if (results.length > 0 && results.length < limit) {
    const foundIds = [...seenIds];
    const analogues = await prisma.productAnalogue.findMany({
      where: {
        originalId: { in: foundIds },
        analogue: baseWhere,
      },
      include: {
        analogue: { select: productSelect },
      },
      take: limit - results.length,
    });

    for (const a of analogues) {
      if (!seenIds.has(a.analogueId)) {
        seenIds.add(a.analogueId);
        results.push(mapProduct(a.analogue, 'analogue'));
      }
    }
  }

  // ----- PHASE 4: Trigram / fuzzy search on catalog numbers -----
  if (results.length < limit && normalized.length >= 3) {
    try {
      const fuzzyResults = await prisma.$queryRaw<Array<{ product_id: string; original_number: string; similarity: number }>>`
        SELECT DISTINCT cn.product_id, cn.original_number,
               similarity(cn.normalized_number, ${normalized}) as similarity
        FROM "CatalogNumber" cn
        JOIN "Product" p ON p.id = cn.product_id
        WHERE p.is_active = true
          AND cn.product_id NOT IN (${Prisma.join([...seenIds].length > 0 ? [...seenIds] : ['__none__'])})
          AND similarity(cn.normalized_number, ${normalized}) > 0.3
        ORDER BY similarity DESC
        LIMIT ${limit - results.length}
      `;

      if (fuzzyResults.length > 0) {
        const fuzzyProducts = await prisma.product.findMany({
          where: {
            id: { in: fuzzyResults.map((r) => r.product_id) },
            ...baseWhere,
          },
          select: productSelect,
        });

        const productMap = new Map(fuzzyProducts.map((p) => [p.id, p]));
        for (const fr of fuzzyResults) {
          const product = productMap.get(fr.product_id);
          if (product && !seenIds.has(product.id)) {
            seenIds.add(product.id);
            results.push(mapProduct(product, 'fuzzy', fr.original_number));
          }
        }
      }
    } catch (error) {
      // Trigram extension may not be available, fall through to text search
      console.warn('Trigram search not available, falling back to text search');
    }
  }

  // ----- PHASE 5: Text search on product name -----
  if (results.length < limit) {
    const textResults = await prisma.product.findMany({
      where: {
        ...baseWhere,
        id: { notIn: [...seenIds] },
        OR: [
          { name: { contains: query.trim(), mode: 'insensitive' } },
          { description: { contains: query.trim(), mode: 'insensitive' } },
        ],
      },
      select: productSelect,
      take: limit - results.length,
      skip: results.length === 0 ? offset : 0,
    });

    for (const product of textResults) {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id);
        results.push(mapProduct(product, 'text'));
      }
    }
  }

  return {
    results,
    total: results.length,
    page,
    limit,
  };
}

// =============================================================================
// VEHICLE SEARCH
// =============================================================================

export async function searchByVehicle(makeId: string, modelId: string, year?: number) {
  const where: Prisma.VehicleApplicationWhereInput = {
    vehicleYear: {
      model: { id: modelId, makeId },
      ...(year && { year }),
    },
    product: { isActive: true },
  };

  const apps = await prisma.vehicleApplication.findMany({
    where,
    include: {
      product: { select: productSelect },
    },
    take: 100,
  });

  return apps.map((a) => mapProduct(a.product, 'exact'));
}
