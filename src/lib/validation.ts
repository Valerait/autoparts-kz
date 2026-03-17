import { z } from 'zod';

// =============================================================================
// COMMON VALIDATORS
// =============================================================================

export const phoneSchema = z
  .string()
  .min(10, 'Некорректный номер телефона')
  .max(15, 'Некорректный номер телефона')
  .regex(/^\+?[0-9]+$/, 'Номер должен содержать только цифры');

export const passwordSchema = z
  .string()
  .min(6, 'Минимум 6 символов')
  .max(100, 'Максимум 100 символов');

export const otpCodeSchema = z
  .string()
  .length(6, 'Код должен содержать 6 цифр')
  .regex(/^[0-9]+$/, 'Код должен содержать только цифры');

// =============================================================================
// AUTH SCHEMAS
// =============================================================================

export const registerSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Минимум 2 символа').max(100).optional(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export const whatsappSendOtpSchema = z.object({
  phone: phoneSchema,
});

export const whatsappVerifyOtpSchema = z.object({
  phone: phoneSchema,
  code: otpCodeSchema,
});

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const searchQuerySchema = z.object({
  q: z.string().min(2, 'Минимум 2 символа'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  inStock: z.coerce.boolean().optional(),
});

export const vehicleSearchSchema = z.object({
  makeId: z.string().min(1),
  modelId: z.string().min(1),
  year: z.coerce.number().int().optional(),
});

// =============================================================================
// ORDER SCHEMAS
// =============================================================================

export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Укажите имя'),
  customerPhone: phoneSchema,
  customerEmail: z.string().email().optional().or(z.literal('')),
  deliveryAddress: z.string().optional(),
  comment: z.string().max(1000).optional(),
  contactMethod: z.enum(['phone', 'whatsapp', 'email']).default('phone'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['NEW', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED']),
  comment: z.string().optional(),
});

// =============================================================================
// CART SCHEMAS
// =============================================================================

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(999).default(1),
});

export const updateCartSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(999),
});

// =============================================================================
// ADMIN PRODUCT SCHEMAS
// =============================================================================

export const adminProductSchema = z.object({
  name: z.string().min(2).max(500),
  sku: z.string().min(1).max(100),
  brandId: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  comparePrice: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isOnOrder: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDesc: z.string().optional(),
  catalogNumbers: z.array(z.object({
    originalNumber: z.string().min(1),
    numberType: z.enum(['OEM', 'CROSS', 'ALIAS', 'SKU']).default('OEM'),
    brandName: z.string().optional(),
  })).optional(),
});
