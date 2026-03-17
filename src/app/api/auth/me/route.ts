import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { success, unauthorized, handleApiError } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    const payload = await authenticateRequest(request);
    if (!payload) {
      return unauthorized();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId, isActive: true },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        phoneVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return unauthorized('Пользователь не найден');
    }

    return success({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
