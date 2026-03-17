import { prisma } from '@/lib/prisma';
import { success, error, handleApiError, validationError } from '@/lib/api-response';
import { whatsappSendOtpSchema } from '@/lib/validation';
import { checkRateLimit, getOtpRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit';
import { createAndSendOtp } from '@/services/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = whatsappSendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { phone } = parsed.data;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const otpRateLimit = getOtpRateLimit();

    // Rate limit by IP
    const ipLimit = checkRateLimit(`otp:ip:${ip}`, otpRateLimit);
    if (!ipLimit.allowed) {
      return error('Слишком много запросов. Попробуйте позже.', 429);
    }

    // Rate limit by phone
    const phoneLimit = checkRateLimit(`otp:phone:${phone}`, otpRateLimit);
    if (!phoneLimit.allowed) {
      return error('Слишком много запросов на этот номер. Попробуйте позже.', 429);
    }

    // Send OTP
    const result = await createAndSendOtp(phone);

    if (!result.success) {
      return error(result.error || 'Не удалось отправить код', 500);
    }

    // Audit log
    await auditLog({
      action: 'SEND_OTP',
      entity: 'OtpCode',
      details: { phone },
      ip: ip || undefined,
    });

    return success({ message: 'Код отправлен в WhatsApp' });
  } catch (err) {
    return handleApiError(err);
  }
}
