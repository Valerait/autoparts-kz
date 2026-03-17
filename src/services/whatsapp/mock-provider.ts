import type { WhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from './types';

/**
 * Mock WhatsApp provider for local development.
 * Logs messages to console instead of sending them.
 */
export class MockWhatsAppProvider implements WhatsAppProvider {
  name = 'mock';

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    console.log('========================================');
    console.log('[MOCK WHATSAPP] Sending message:');
    console.log(`  To: ${message.to}`);
    console.log(`  Body: ${message.body}`);
    console.log('========================================');

    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }

  async sendOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
    const message: WhatsAppMessage = {
      to: phone,
      body: `Ваш код подтверждения: ${code}\nДействителен ${process.env.OTP_EXPIRES_MINUTES || 5} минут.\nНе сообщайте его никому.`,
    };
    return this.sendMessage(message);
  }
}
