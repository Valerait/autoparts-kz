import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, error, handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
  newPassword: z.string().min(6, 'Минимум 6 символов'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const data = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return error('Пользователь не найден или пароль не установлен', 400);
    }

    const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValid) {
      return error('Неверный текущий пароль', 400);
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await auditLog({
      userId: auth.user.userId,
      action: 'CHANGE_PASSWORD',
      entity: 'User',
      entityId: user.id,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({ message: 'Пароль успешно изменён' });
  } catch (err) {
    return handleApiError(err);
  }
}
