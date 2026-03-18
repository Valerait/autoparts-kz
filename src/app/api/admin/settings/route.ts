import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import { success, handleApiError } from '@/lib/api-response';
import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

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

const DEFAULT_SETTINGS: StoreSettings = {
  store: {
    name: 'АвтоЗапчасти',
    phone: '+77001234567',
    email: 'info@autozapchasti.kz',
    address: 'г. Алматы, ул. Абая, 1',
    workingHours: 'Пн-Пт: 9:00-18:00, Сб: 10:00-16:00',
  },
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'not configured',
    connected: !!process.env.WHATSAPP_API_KEY,
    phone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  },
};

async function loadSettings(): Promise<StoreSettings> {
  try {
    const data = await readFile(SETTINGS_FILE, 'utf-8');
    const saved = JSON.parse(data);
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      whatsapp: {
        ...DEFAULT_SETTINGS.whatsapp,
        ...(saved.whatsapp || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveSettings(settings: Partial<StoreSettings>) {
  const dir = path.dirname(SETTINGS_FILE);
  await mkdir(dir, { recursive: true });
  const current = await loadSettings();
  const merged = { ...current, ...settings };
  await writeFile(SETTINGS_FILE, JSON.stringify(merged, null, 2));
  return merged;
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

    const saved = await saveSettings(current);
    return success(saved);
  } catch (err) {
    return handleApiError(err);
  }
}
