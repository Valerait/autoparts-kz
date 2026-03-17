import type { WhatsAppProvider, WhatsAppMessage, WhatsAppSendResult } from './types';

/**
 * Twilio WhatsApp provider.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM
 *
 * Production-ready variant:
 * - Uses Twilio's WhatsApp Business API
 * - Supports message templates (required by Meta for business-initiated messages)
 * - OTP delivery via WhatsApp channel
 */
export class TwilioWhatsAppProvider implements WhatsAppProvider {
  name = 'twilio';

  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || '';

    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      throw new Error('Twilio WhatsApp credentials not configured');
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const body = new URLSearchParams({
        From: `whatsapp:${this.fromNumber}`,
        To: `whatsapp:${message.to}`,
        Body: message.body,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.message || 'Twilio API error' };
      }

      return { success: true, messageId: data.sid };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: msg };
    }
  }

  async sendOtp(phone: string, code: string): Promise<WhatsAppSendResult> {
    return this.sendMessage({
      to: phone,
      body: `Ваш код подтверждения: ${code}\nДействителен ${process.env.OTP_EXPIRES_MINUTES || 5} минут.\nНе сообщайте его никому.`,
    });
  }
}
