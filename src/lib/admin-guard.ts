import { authenticateRequest, JwtPayload } from './auth';
import { prisma } from './prisma';
import { unauthorized, forbidden } from './api-response';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAdmin(request: NextRequest): Promise<{ user: JwtPayload } | NextResponse> {
  const payload = await authenticateRequest(request);
  if (!payload) return unauthorized();
  if (payload.role !== 'ADMIN' && payload.role !== 'MANAGER') return forbidden();
  return { user: payload };
}
