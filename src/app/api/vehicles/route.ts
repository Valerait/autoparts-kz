import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const makeId = searchParams.get('makeId');
    const modelId = searchParams.get('modelId');

    // Return years for a specific model
    if (modelId) {
      const years = await prisma.vehicleYear.findMany({
        where: { modelId },
        orderBy: { year: 'asc' },
      });
      return success(years);
    }

    // Return models for a specific make
    if (makeId) {
      const models = await prisma.vehicleModel.findMany({
        where: { makeId },
        orderBy: { name: 'asc' },
      });
      return success(models);
    }

    // Return all makes
    const makes = await prisma.vehicleMake.findMany({
      orderBy: { name: 'asc' },
    });

    return success(makes);
  } catch (err) {
    return handleApiError(err);
  }
}
