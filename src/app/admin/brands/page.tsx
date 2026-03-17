'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive?: boolean;
  _count?: { products: number };
}

interface FormData {
  name: string;
  slug: string;
  isActive: boolean;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/brands');
      if (res.ok) {
        const json = await res.json();
        setBrands(json.data || []);
      }
    } catch {
      toast.error('Ошибка загрузки брендов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', slug: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    reset({
      name: brand.name,
      slug: brand.slug,
      isActive: brand.isActive ?? true,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const url = editing ? `/api/admin/brands/${editing.id}` : '/api/admin/brands';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(editing ? 'Бренд обновлён' : 'Бренд создан');
        setModalOpen(false);
        fetchBrands();
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

  const deleteBrand = async (id: string) => {
    if (!confirm('Удалить бренд?')) return;
    try {
      const res = await fetch(`/api/admin/brands/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Бренд удалён');
        fetchBrands();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Бренды</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              <th className="px-5 py-3 font-medium text-slate-600">Название</th>
              <th className="px-5 py-3 font-medium text-slate-600">Slug</th>
              <th className="px-5 py-3 font-medium text-slate-600">Товаров</th>
              <th className="px-5 py-3 font-medium text-slate-600">Статус</th>
              <th className="px-5 py-3 font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                  Загрузка...
                </td>
              </tr>
            ) : brands.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                  Брендов пока нет
                </td>
              </tr>
            ) : (
              brands.map((brand) => (
                <tr
                  key={brand.id}
                  className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">{brand.name}</td>
                  <td className="px-5 py-3 text-slate-500">{brand.slug}</td>
                  <td className="px-5 py-3 text-slate-600">{brand._count?.products ?? '—'}</td>
                  <td className="px-5 py-3">
                    <Badge variant={brand.isActive !== false ? 'success' : 'danger'}>
                      {brand.isActive !== false ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(brand)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteBrand(brand.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? 'Редактирование бренда' : 'Новый бренд'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
              <Input
                label="Название *"
                {...register('name', { required: 'Обязательное поле' })}
                error={errors.name?.message}
              />

              <Input
                label="Slug"
                {...register('slug')}
                placeholder="Автоматически из названия"
              />

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('isActive')} className="rounded" />
                Активен
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                  Отмена
                </Button>
                <Button type="submit" isLoading={saving}>
                  {editing ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
