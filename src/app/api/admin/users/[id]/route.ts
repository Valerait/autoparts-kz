import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, notFound, error, handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['CUSTOMER', 'MANAGER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        phoneVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { orders: true, favorites: true } },
      },
    });

    if (!user) return notFound('User not found');
    return success(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return notFound('User not found');

    // Only ADMIN can change roles
    if (data.role && auth.user.role !== 'ADMIN') {
      return error('Только администратор может менять роли', 403);
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email || null;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.phoneVerified !== undefined) updateData.phoneVerified = data.phoneVerified;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        role: true,
        provider: true,
        phoneVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await auditLog({
      userId: auth.user.userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      details: {
        changed: Object.keys(data).filter((k) => k !== 'password'),
        targetPhone: user.phone,
      },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    // Only ADMIN can delete users
    if (auth.user.role !== 'ADMIN') {
      return error('Только администратор может удалять пользователей', 403);
    }

    const { id } = await params;

    // Prevent self-deletion
    if (id === auth.user.userId) {
      return error('Невозможно удалить свой аккаунт', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, phone: true, name: true, _count: { select: { orders: true } } },
    });
    if (!user) return notFound('User not found');

    if (user._count.orders > 0) {
      // Soft delete - deactivate instead
      await prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      await auditLog({
        userId: auth.user.userId,
        action: 'DEACTIVATE',
        entity: 'User',
        entityId: id,
        details: { phone: user.phone, reason: 'has orders' },
        ip: request.headers.get('x-forwarded-for') || undefined,
      });

      return success({ deleted: false, deactivated: true, reason: 'У пользователя есть заказы — аккаунт деактивирован' });
    }

    // Hard delete users without orders
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({ where: { userId: id } }),
      prisma.otpCode.deleteMany({ where: { userId: id } }),
      prisma.cartItem.deleteMany({ where: { userId: id } }),
      prisma.favorite.deleteMany({ where: { userId: id } }),
      prisma.userVehicle.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    await auditLog({
      userId: auth.user.userId,
      action: 'DELETE',
      entity: 'User',
      entityId: id,
      details: { phone: user.phone, name: user.name },
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
