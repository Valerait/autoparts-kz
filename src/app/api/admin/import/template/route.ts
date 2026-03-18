import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-guard';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const headers = ['name', 'sku', 'brand', 'category', 'oem', 'cross_numbers', 'price', 'quantity', 'description'];

    const exampleRows = [
      {
        name: 'Масляный фильтр Toyota',
        sku: 'TF-04152',
        brand: 'Toyota',
        category: 'Фильтры',
        oem: '04152-YZZA1',
        cross_numbers: 'MANN W 68/3;FILTRON OP 575',
        price: '2500',
        quantity: '10',
        description: 'Оригинальный масляный фильтр для Toyota Camry, Corolla',
      },
      {
        name: 'Тормозные колодки передние',
        sku: 'BP-D2104',
        brand: 'Brembo',
        category: 'Тормозная система',
        oem: '04465-33471',
        cross_numbers: '',
        price: '8500',
        quantity: '5',
        description: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers });

    // Set column widths
    worksheet['!cols'] = [
      { wch: 30 }, // name
      { wch: 15 }, // sku
      { wch: 15 }, // brand
      { wch: 20 }, // category
      { wch: 20 }, // oem
      { wch: 30 }, // cross_numbers
      { wch: 10 }, // price
      { wch: 10 }, // quantity
      { wch: 40 }, // description
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Товары');

    // Add instructions sheet
    const instructions = [
      { Поле: 'name', Описание: 'Название товара (обязательное)', Пример: 'Масляный фильтр Toyota' },
      { Поле: 'sku', Описание: 'Артикул / SKU (обязательное, уникальное)', Пример: 'TF-04152' },
      { Поле: 'brand', Описание: 'Бренд (обязательное, должен существовать в системе)', Пример: 'Toyota' },
      { Поле: 'category', Описание: 'Категория (должна существовать в системе)', Пример: 'Фильтры' },
      { Поле: 'oem', Описание: 'OEM номера через ; или ,', Пример: '04152-YZZA1' },
      { Поле: 'cross_numbers', Описание: 'Кросс-номера через ; или ,', Пример: 'MANN W 68/3;FILTRON OP 575' },
      { Поле: 'price', Описание: 'Цена в тенге', Пример: '2500' },
      { Поле: 'quantity', Описание: 'Количество на складе', Пример: '10' },
      { Поле: 'description', Описание: 'Описание товара', Пример: 'Оригинальный масляный фильтр' },
    ];

    const instrSheet = XLSX.utils.json_to_sheet(instructions);
    instrSheet['!cols'] = [{ wch: 15 }, { wch: 45 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(workbook, instrSheet, 'Инструкция');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="import-template.xlsx"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
