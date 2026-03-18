import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, handleApiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const contents = await prisma.siteContent.findMany({
      orderBy: { key: 'asc' },
    });

    return success(contents);
  } catch (err) {
    return handleApiError(err);
  }
}
