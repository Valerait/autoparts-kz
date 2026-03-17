'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { Plus, Edit2, Trash2, X, FolderTree, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number; children: number };
  metaTitle?: string;
  metaDesc?: string;
}

interface FormData {
  name: string;
  parentId: string;
  description: string;
  metaTitle: string;
  metaDesc: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch {
      toast.error('Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', parentId: '', description: '', metaTitle: '', metaDesc: '' });
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    reset({
      name: cat.name,
      parentId: cat.parentId || '',
      description: cat.description || '',
      metaTitle: cat.metaTitle || '',
      metaDesc: cat.metaDesc || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const body = { ...data, parentId: data.parentId || null };
      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editing ? 'Категория обновлена' : 'Категория создана');
        setModalOpen(false);
        fetchCategories();
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

  const deleteCategory = async (id: string) => {
    if (!confirm('Удалить категорию?')) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Категория удалена');
        fetchCategories();
      } else {
        toast.error('Ошибка удаления');
      }
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  // Build tree structure
  const rootCategories = categories.filter((c) => !c.parentId);
  const childCategories = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Категории</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Добавить
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-slate-400">Загрузка...</div>
        ) : categories.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-slate-400">
            <div className="text-center">
              <FolderTree className="mx-auto mb-2 h-8 w-8" />
              <p>Категорий пока нет</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rootCategories.map((cat) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <FolderTree className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-900">{cat.name}</span>
                    {cat._count && (
                      <span className="text-xs text-slate-400">
                        ({cat._count.products} товаров)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(cat)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {/* Children */}
                {childCategories(cat.id).map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between px-5 py-3 pl-12 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronRight className="h-3 w-3 text-slate-300" />
                      <span className="text-slate-700">{child.name}</span>
                      {child._count && (
                        <span className="text-xs text-slate-400">
                          ({child._count.products} товаров)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(child)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-primary-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(child.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? 'Редактирование категории' : 'Новая категория'}
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Родительская категория
                </label>
                <select
                  {...register('parentId')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Без родителя (корневая)</option>
                  {categories
                    .filter((c) => c.id !== editing?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Описание</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">SEO</h3>
                <div className="space-y-3">
                  <Input label="Meta Title" {...register('metaTitle')} />
                  <Input label="Meta Description" {...register('metaDesc')} />
                </div>
              </div>

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
