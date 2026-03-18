import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, notFound, handleApiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    const content = await prisma.siteContent.findUnique({ where: { key } });
    if (!content) return notFound('Content not found');
    return success(content);
  } catch (err) {
    return handleApiError(err);
  }
}
