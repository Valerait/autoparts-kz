import type { WhatsAppProvider } from './types';
import { MockWhatsAppProvider } from './mock-provider';
import { TwilioWhatsAppProvider } from './twilio-provider';
import { MetaCloudWhatsAppProvider } from './meta-cloud-provider';

export type { WhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from './types';

let _provider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (_provider) return _provider;

  const providerName = process.env.WHATSAPP_PROVIDER || 'mock';

  switch (providerName) {
    case 'twilio':
      _provider = new TwilioWhatsAppProvider();
      break;
    case 'meta_cloud':
      _provider = new MetaCloudWhatsAppProvider();
      break;
    case 'mock':
    default:
      _provider = new MockWhatsAppProvider();
      break;
  }

  console.log(`[WhatsApp] Using provider: ${_provider.name}`);
  return _provider;
}

// =============================================================================
// OTP SERVICE
// =============================================================================

import { prisma } from '@/lib/prisma';

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(phone: string): Promise<{ success: boolean; error?: string }> {
  const code = generateOtpCode();
  const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '5');

  // Save OTP to database
  await prisma.otpCode.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + expiresMinutes * 60 * 1000),
    },
  });

  // Send via WhatsApp
  const provider = getWhatsAppProvider();
  const result = await provider.sendOtp(phone, code);

  if (!result.success) {
    console.error(`[OTP] Failed to send to ${phone}:`, result.error);
    return { success: false, error: 'Не удалось отправить код. Попробуйте позже.' };
  }

  return { success: true };
}

export async function verifyOtp(phone: string, code: string): Promise<{ valid: boolean; error?: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      verified: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { valid: false, error: 'Неверный или просроченный код' };
  }

  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');
  if (otp.attempts >= maxAttempts) {
    return { valid: false, error: 'Превышено количество попыток. Запросите новый код.' };
  }

  // Mark as verified
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { verified: true, attempts: { increment: 1 } },
  });

  return { valid: true };
}
