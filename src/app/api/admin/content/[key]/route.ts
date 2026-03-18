import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, notFound, handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { key } = await params;
    const content = await prisma.siteContent.findUnique({ where: { key } });
    if (!content) return notFound('Content not found');

    return success(content);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { key } = await params;
    const body = await request.json();

    const content = await prisma.siteContent.upsert({
      where: { key },
      update: { value: body.value },
      create: { key, value: body.value },
    });

    await auditLog({
      userId: auth.user.userId,
      action: 'UPDATE',
      entity: 'SiteContent',
      entityId: key,
      ip: request.headers.get('x-forwarded-for') || undefined,
    });

    return success(content);
  } catch (err) {
    return handleApiError(err);
  }
}
