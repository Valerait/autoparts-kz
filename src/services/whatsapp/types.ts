// =============================================================================
// WHATSAPP PROVIDER ABSTRACTION LAYER
// =============================================================================
// Production-ready: подключить Twilio / Meta Cloud API / 360dialog
// MVP: mock provider для локальной разработки
// =============================================================================

export interface WhatsAppMessage {
  to: string;      // Phone number in international format
  body: string;    // Message text
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface WhatsAppProvider {
  name: string;
  sendMessage(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
  sendOtp(phone: string, code: string): Promise<WhatsAppSendResult>;
}
