import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-guard';
import { success, error, handleApiError } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';
import { normalizePartNumber } from '@/services/catalog-search';
import slugify from 'slugify';
import * as XLSX from 'xlsx';

interface ImportRowError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: ImportRowError[];
  dryRun: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const dryRun = searchParams.get('dryRun') === 'true';

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return error('No file provided', 400);
    }

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return error('Unsupported file format. Please upload CSV or Excel file.', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return error('Empty file: no sheets found', 400);
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (rows.length === 0) {
      return error('File contains no data rows', 400);
    }

    const result: ImportResult = {
      totalRows: rows.length,
      successRows: 0,
      errorRows: 0,
      errors: [],
      dryRun,
    };

    // Pre-fetch all brands and categories for matching
    const [allBrands, allCategories] = await Promise.all([
      prisma.brand.findMany({ select: { id: true, name: true } }),
      prisma.category.findMany({ select: { id: true, name: true } }),
    ]);

    const brandMap = new Map(allBrands.map((b) => [b.name.toLowerCase(), b.id]));
    const categoryMap = new Map(allCategories.map((c) => [c.name.toLowerCase(), c.id]));

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, data starts at 2
      const rowErrors: ImportRowError[] = [];

      // Extract fields
      const name = String(row.name || '').trim();
      const brandName = String(row.brand || '').trim();
      const sku = String(row.sku || '').trim();
      const oem = String(row.oem || '').trim();
      const crossNumbers = String(row.cross_numbers || '').trim();
      const priceStr = String(row.price || '').trim();
      const quantityStr = String(row.quantity || '').trim();
      const description = String(row.description || '').trim();
      const categoryName = String(row.category || '').trim();

      // Validate required fields
      if (!name) rowErrors.push({ row: rowNum, field: 'name', message: 'Name is required' });
      if (!sku) rowErrors.push({ row: rowNum, field: 'sku', message: 'SKU is required' });
      if (!brandName) rowErrors.push({ row: rowNum, field: 'brand', message: 'Brand is required' });

      // Resolve brand
      let brandId = brandMap.get(brandName.toLowerCase());
      if (!brandId && brandName) {
        rowErrors.push({ row: rowNum, field: 'brand', message: `Brand "${brandName}" not found` });
      }

      // Resolve category
      let categoryId = categoryMap.get(categoryName.toLowerCase());
      if (!categoryId && categoryName) {
        rowErrors.push({ row: rowNum, field: 'category', message: `Category "${categoryName}" not found` });
      }

      // Parse price
      const price = priceStr ? parseFloat(priceStr) : undefined;
      if (priceStr && (isNaN(price!) || price! < 0)) {
        rowErrors.push({ row: rowNum, field: 'price', message: 'Invalid price value' });
      }

      // Parse quantity
      const quantity = quantityStr ? parseInt(quantityStr, 10) : 0;
      if (quantityStr && (isNaN(quantity) || quantity < 0)) {
        rowErrors.push({ row: rowNum, field: 'quantity', message: 'Invalid quantity value' });
      }

      if (rowErrors.length > 0) {
        result.errors.push(...rowErrors);
        result.errorRows++;
        continue;
      }

      if (dryRun) {
        result.successRows++;
        continue;
      }

      try {
        // Build catalog numbers
        const catalogEntries: Array<{
          originalNumber: string;
          normalizedNumber: string;
          numberType: string;
          brandName?: string;
        }> = [];

        if (oem) {
          oem.split(/[,;|]/).forEach((num) => {
            const trimmed = num.trim();
            if (trimmed) {
              catalogEntries.push({
                originalNumber: trimmed,
                normalizedNumber: normalizePartNumber(trimmed),
                numberType: 'OEM',
                brandName: brandName || undefined,
              });
            }
          });
        }

        if (crossNumbers) {
          crossNumbers.split(/[,;|]/).forEach((num) => {
            const trimmed = num.trim();
            if (trimmed) {
              catalogEntries.push({
                originalNumber: trimmed,
                normalizedNumber: normalizePartNumber(trimmed),
                numberType: 'CROSS',
              });
            }
          });
        }

        // Also add SKU as catalog number
        catalogEntries.push({
          originalNumber: sku,
          normalizedNumber: normalizePartNumber(sku),
          numberType: 'SKU',
          brandName: brandName || undefined,
        });

        const slug = slugify(name, { lower: true, strict: true });

        // Upsert by SKU
        const existingProduct = await prisma.product.findUnique({
          where: { sku },
          select: { id: true },
        });

        if (existingProduct) {
          // Update existing product
          await prisma.product.update({
            where: { sku },
            data: {
              name,
              brandId: brandId!,
              ...(categoryId && { categoryId }),
              ...(description && { description }),
              ...(price !== undefined && { price }),
              quantity,
            },
          });

          // Replace catalog numbers
          await prisma.catalogNumber.deleteMany({
            where: { productId: existingProduct.id },
          });

          if (catalogEntries.length > 0) {
            await prisma.catalogNumber.createMany({
              data: catalogEntries.map((entry) => ({
                productId: existingProduct.id,
                ...entry,
              })),
            });
          }
        } else {
          // Generate unique slug
          let finalSlug = slug;
          let suffix = 1;
          while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
            finalSlug = `${slug}-${suffix}`;
            suffix++;
          }

          await prisma.product.create({
            data: {
              name,
              slug: finalSlug,
              sku,
              brandId: brandId!,
              categoryId: categoryId || allCategories[0]?.id || '',
              description: description || undefined,
              price: price !== undefined ? price : undefined,
              quantity,
              catalogNumbers: {
                create: catalogEntries,
              },
            },
          });
        }

        result.successRows++;
      } catch (rowError) {
        result.errorRows++;
        result.errors.push({
          row: rowNum,
          field: 'general',
          message: rowError instanceof Error ? rowError.message : 'Unknown error',
        });
      }
    }

    // Create import log
    if (!dryRun) {
      await prisma.importLog.create({
        data: {
          fileName: file.name,
          totalRows: result.totalRows,
          successRows: result.successRows,
          errorRows: result.errorRows,
          errors: result.errors as any,
          status: result.errorRows === result.totalRows ? 'failed' : 'completed',
          startedBy: auth.user.userId,
          completedAt: new Date(),
        },
      });

      await auditLog({
        userId: auth.user.userId,
        action: 'IMPORT',
        entity: 'Product',
        details: {
          fileName: file.name,
          totalRows: result.totalRows,
          successRows: result.successRows,
          errorRows: result.errorRows,
        },
        ip: request.headers.get('x-forwarded-for') || undefined,
      });
    }

    return success(result, dryRun ? 200 : 201);
  } catch (err) {
    return handleApiError(err);
  }
}
