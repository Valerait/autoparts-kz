import type { WhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from './types';

/**
 * Meta WhatsApp Cloud API provider.
 * Requires: META_WHATSAPP_TOKEN, META_WHATSAPP_PHONE_ID
 *
 * Production-ready variant:
 * - Direct integration with Meta's Cloud API
 * - Supports message templates
 * - Requires approved WhatsApp Business account
 */
export class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  name = 'meta_cloud';

  private token: string;
  private phoneId: string;

  constructor() {
    this.token = process.env.META_WHATSAPP_TOKEN || '';
    this.phoneId = process.env.META_WHATSAPP_PHONE_ID || '';

    if (!this.token || !this.phoneId) {
      throw new Error('Meta WhatsApp Cloud API credentials not configured');
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneId}/messages`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to.replace(/\D/g, ''),
          type: 'text',
          text: { body: message.body },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error?.message || 'Meta API error' };
      }

      return { success: true, messageId: data.messages?.[0]?.id };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: msg };
    }
  }

  async sendOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
    return this.sendMessage({
      to: phone,
      body: `Ваш код подтверждения: ${code}\nДействителен ${process.env.OTP_EXPIRES_MINUTES || 5} минут.`,
    });
  }
}
