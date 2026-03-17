import { NextRequest } from 'next/server';
import { searchQuerySchema } from '@/lib/validation';
import { searchProducts } from '@/services/catalog-search';
import { paginated, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = searchQuerySchema.parse({
      q: searchParams.get('q') ?? '',
      page: searchParams.get('page') ?? 1,
      limit: searchParams.get('limit') ?? 20,
      brandId: searchParams.get('brandId') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      inStock: searchParams.get('inStock') ?? undefined,
    });

    const result = await searchProducts({
      query: params.q,
      page: params.page,
      limit: params.limit,
      brandId: params.brandId,
      categoryId: params.categoryId,
      inStockOnly: params.inStock,
    });

    return paginated(result.results, result.total, result.page, result.limit);
  } catch (err) {
    return handleApiError(err);
  }
}
