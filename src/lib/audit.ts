import { prisma } from './prisma';

export async function auditLog(params: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        details: params.details as any,
        ip: params.ip,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
