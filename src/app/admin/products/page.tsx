'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  slug: string;
  price: number | null;
  comparePrice: number | null;
  quantity: number;
  isActive: boolean;
  isOnOrder: boolean;
  brand?: { id: string; name: string };
  category?: { id: string; name: string };
  images?: Array<{ url: string; alt: string | null }>;
  description?: string;
  shortDescription?: string;
  metaTitle?: string;
  metaDesc?: string;
  brandId?: string;
  categoryId?: string;
  catalogNumbers?: Array<{
    id?: string;
    originalNumber: string;
    numberType: string;
    brandName?: string;
  }>;
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface FormData {
  name: string;
  sku: string;
  brandId: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  price: number | string;
  comparePrice: number | string;
  quantity: number;
  isActive: boolean;
  isOnOrder: boolean;
  metaTitle: string;
  metaDesc: string;
  catalogNumbers: Array<{
    originalNumber: string;
    numberType: 'OEM' | 'CROSS' | 'ALIAS' | 'SKU';
    brandName: string;
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      catalogNumbers: [],
      isActive: true,
      isOnOrder: false,
      quantity: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'catalogNumbers',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/products?${params}`);
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data?.products || json.data || []);
        setTotal(json.data?.total || 0);
      }
    } catch {
      toast.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchMeta = useCallback(async () => {
    try {
      const [brandsRes, catsRes] = await Promise.all([
        fetch('/api/admin/brands'),
        fetch('/api/admin/categories'),
      ]);
      if (brandsRes.ok) {
        const b = await brandsRes.json();
        setBrands(b.data || []);
      }
      if (catsRes.ok) {
        const c = await catsRes.json();
        setCategories(c.data || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const openCreate = () => {
    setEditingProduct(null);
    reset({
      name: '',
      sku: '',
      brandId: '',
      categoryId: '',
      description: '',
      shortDescription: '',
      price: '',
      comparePrice: '',
      quantity: 0,
      isActive: true,
      isOnOrder: false,
      metaTitle: '',
      metaDesc: '',
      catalogNumbers: [],
    });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      sku: product.sku,
      brandId: product.brandId || product.brand?.id || '',
      categoryId: product.categoryId || product.category?.id || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price ?? '',
      comparePrice: product.comparePrice ?? '',
      quantity: product.quantity,
      isActive: product.isActive,
      isOnOrder: product.isOnOrder,
      metaTitle: product.metaTitle || '',
      metaDesc: product.metaDesc || '',
      catalogNumbers: product.catalogNumbers?.map((cn) => ({
        originalNumber: cn.originalNumber,
        numberType: cn.numberType as 'OEM' | 'CROSS' | 'ALIAS' | 'SKU',
        brandName: cn.brandName || '',
      })) || [],
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const body = {
        ...data,
        price: data.price !== '' ? Number(data.price) : undefined,
        comparePrice: data.comparePrice !== '' ? Number(data.comparePrice) : undefined,
        quantity: Number(data.quantity),
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingProduct ? 'Товар обновлён' : 'Товар создан');
        setModalOpen(false);
        fetchProducts();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Ошибка сохранения');
      }
    } catch {
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Удалить товар?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Товар удалён');
        fetchProducts();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Товары</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить товар
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию, артикулу..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-4 py-3 font-medium text-slate-600">Фото</th>
              <th className="px-4 py-3 font-medium text-slate-600">Название</th>
              <th className="px-4 py-3 font-medium text-slate-600">Артикул</th>
              <th className="px-4 py-3 font-medium text-slate-600">Бренд</th>
              <th className="px-4 py-3 font-medium text-slate-600">Категория</th>
              <th className="px-4 py-3 font-medium text-slate-600">Цена</th>
              <th className="px-4 py-3 font-medium text-slate-600">Кол-во</th>
              <th className="px-4 py-3 font-medium text-slate-600">Статус</th>
              <th className="px-4 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  Загрузка...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                  Товары не найдены
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    {product.images?.[0]?.url ? (
                      <img
                        src={product.images[0].url}
                        alt={product.images[0].alt || product.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <ImageIcon className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-slate-900">
                    {product.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.sku}</td>
                  <td className="px-4 py-3 text-slate-600">{product.brand?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{product.category?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'font-medium',
                        product.quantity > 0 ? 'text-green-600' : 'text-red-500'
                      )}
                    >
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={product.isActive ? 'success' : 'danger'}>
                      {product.isActive ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(product)}
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProduct ? 'Редактирование товара' : 'Новый товар'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Название *"
                    {...register('name', { required: 'Обязательное поле' })}
                    error={errors.name?.message}
                  />
                  <Input
                    label="Артикул (SKU) *"
                    {...register('sku', { required: 'Обязательное поле' })}
                    error={errors.sku?.message}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Бренд *
                    </label>
                    <select
                      {...register('brandId', { required: 'Выберите бренд' })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Выберите бренд</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {errors.brandId && (
                      <p className="mt-1 text-xs text-red-600">{errors.brandId.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Категория *
                    </label>
                    <select
                      {...register('categoryId', { required: 'Выберите категорию' })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-xs text-red-600">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Input
                    label="Цена"
                    type="number"
                    step="0.01"
                    {...register('price')}
                  />
                  <Input
                    label="Цена до скидки"
                    type="number"
                    step="0.01"
                    {...register('comparePrice')}
                  />
                  <Input
                    label="Количество"
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Описание</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <Input label="Краткое описание" {...register('shortDescription')} />

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register('isActive')} className="rounded" />
                    Активен
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register('isOnOrder')} className="rounded" />
                    Под заказ
                  </label>
                </div>

                {/* SEO */}
                <div className="border-t border-slate-200 pt-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">SEO</h3>
                  <div className="space-y-3">
                    <Input label="Meta Title" {...register('metaTitle')} />
                    <Input label="Meta Description" {...register('metaDesc')} />
                  </div>
                </div>

                {/* Catalog numbers */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">Каталожные номера</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({ originalNumber: '', numberType: 'OEM', brandName: '' })
                      }
                    >
                      <Plus className="h-3 w-3" />
                      Добавить
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-2">
                        <Input
                          placeholder="Номер"
                          {...register(`catalogNumbers.${index}.originalNumber`)}
                          className="flex-1"
                        />
                        <select
                          {...register(`catalogNumbers.${index}.numberType`)}
                          className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
                        >
                          <option value="OEM">OEM</option>
                          <option value="CROSS">CROSS</option>
                          <option value="ALIAS">ALIAS</option>
                          <option value="SKU">SKU</option>
                        </select>
                        <Input
                          placeholder="Бренд"
                          {...register(`catalogNumbers.${index}.brandName`)}
                          className="w-28"
                        />
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mt-2 rounded p-1 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" isLoading={saving}>
                  {editingProduct ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
