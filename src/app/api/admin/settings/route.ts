import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, handleApiError } from '@/lib/api-response';
import { z } from 'zod';

interface StoreSettings {
  store: {
    name: string;
    phone: string;
    email: string;
    address: string;
    workingHours: string;
  };
  whatsapp: {
    provider: string;
    connected: boolean;
    phone: string;
  };
}

const DEFAULT_STORE = {
  name: 'АвтоЗапчасти',
  phone: '+77001234567',
  email: 'info@autozapchasti.kz',
  address: 'г. Алматы, ул. Абая, 1',
  workingHours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00',
};

async function loadSettings(): Promise<StoreSettings> {
  const row = await prisma.siteContent.findUnique({ where: { key: 'storeSettings' } });
  const saved = row ? (row.value as Record<string, unknown>) : {};

  return {
    store: { ...DEFAULT_STORE, ...(saved.store as Record<string, string> || {}) },
    whatsapp: {
      provider: process.env.WHATSAPP_PROVIDER || 'mock',
      connected: !!process.env.WHATSAPP_API_KEY,
      phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+77001234567',
    },
  };
}

const updateStoreSchema = z.object({
  store: z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    workingHours: z.string().optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const settings = await loadSettings();
    return success(settings);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const data = updateStoreSchema.parse(body);

    const current = await loadSettings();
    if (data.store) {
      current.store = { ...current.store, ...data.store };
    }

    await prisma.siteContent.upsert({
      where: { key: 'storeSettings' },
      update: { value: { store: current.store } },
      create: { key: 'storeSettings', value: { store: current.store } },
    });

    return success(current);
  } catch (err) {
    return handleApiError(err);
  }
}
