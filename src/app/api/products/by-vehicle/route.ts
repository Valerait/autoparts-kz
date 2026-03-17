import { NextRequest } from 'next/server';
import { vehicleSearchSchema } from '@/lib/validation';
import { searchByVehicle } from '@/services/catalog-search';
import { success, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = vehicleSearchSchema.parse({
      makeId: searchParams.get('makeId') ?? '',
      modelId: searchParams.get('modelId') ?? '',
      year: searchParams.get('year') ?? undefined,
    });

    const results = await searchByVehicle(params.makeId, params.modelId, params.year);

    return success(results);
  } catch (err) {
    return handleApiError(err);
  }
}
