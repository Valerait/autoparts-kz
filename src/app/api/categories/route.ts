import { prisma } from '@/lib/prisma';
import { success, handleApiError } from '@/lib/api-response';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return success(categories);
  } catch (err) {
    return handleApiError(err);
  }
}
