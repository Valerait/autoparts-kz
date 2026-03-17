import { prisma } from '@/lib/prisma';
import { success, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return success(brands);
  } catch (err) {
    return handleApiError(err);
  }
}
