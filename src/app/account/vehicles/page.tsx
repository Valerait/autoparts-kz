'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Car, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
}

interface VehicleFormData {
  make: string;
  model: string;
  year: string;
}

interface MakeOption {
  id: string;
  name: string;
}

interface ModelOption {
  id: string;
  name: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [makes, setMakes] = useState<MakeOption[]>([]);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedMake, setSelectedMake] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<VehicleFormData>();

  // Generate years range
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearsList = [];
    for (let y = currentYear; y >= 1990; y--) {
      yearsList.push(y);
    }
    setYears(yearsList);
  }, []);

  // Fetch vehicles
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch makes
  useEffect(() => {
    const loadMakes = async () => {
      try {
        const res = await fetch('/api/vehicles?type=makes');
        if (res.ok) {
          const json = await res.json();
          setMakes(json.data || []);
        }
      } catch {
        // silently fail
      }
    };
    loadMakes();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      return;
    }
    const loadModels = async () => {
      try {
        const res = await fetch(`/api/vehicles?type=models&make=${encodeURIComponent(selectedMake)}`);
        if (res.ok) {
          const json = await res.json();
          setModels(json.data || []);
        }
      } catch {
        // silently fail
      }
    };
    loadModels();
  }, [selectedMake]);

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles?type=saved');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setVehicles(json.data || []);
    } catch {
      toast.error('Не удалось загрузить автомобили');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: VehicleFormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          make: data.make,
          model: data.model,
          year: parseInt(data.year),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || 'Ошибка добавления');
        return;
      }

      toast.success('Автомобиль добавлен');
      reset();
      setSelectedMake('');
      setShowForm(false);
      await fetchVehicles();
    } catch {
      toast.error('Ошибка сети');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();

      toast.success('Автомобиль удалён');
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch {
      toast.error('Не удалось удалить');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Мой гараж</h2>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        )}
      </div>

      {/* Add Vehicle Form */}
      {showForm && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Новый автомобиль</h3>
            <button
              type="button"
              onClick={() => { setShowForm(false); reset(); setSelectedMake(''); }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Make */}
              <div>
                <label htmlFor="vehicle-make" className="mb-1 block text-sm font-medium text-slate-700">
                  Марка
                </label>
                <select
                  id="vehicle-make"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  {...register('make', { required: 'Выберите марку' })}
                  onChange={(e) => {
                    setValue('make', e.target.value);
                    setSelectedMake(e.target.value);
                    setValue('model', '');
                  }}
                >
                  <option value="">Выберите марку</option>
                  {makes.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.make && (
                  <p className="mt-1 text-xs text-red-600">{errors.make.message}</p>
                )}
              </div>

              {/* Model */}
              <div>
                <label htmlFor="vehicle-model" className="mb-1 block text-sm font-medium text-slate-700">
                  Модель
                </label>
                <select
                  id="vehicle-model"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                  disabled={!selectedMake}
                  {...register('model', { required: 'Выберите модель' })}
                >
                  <option value="">Выберите модель</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.model && (
                  <p className="mt-1 text-xs text-red-600">{errors.model.message}</p>
                )}
              </div>

              {/* Year */}
              <div>
                <label htmlFor="vehicle-year" className="mb-1 block text-sm font-medium text-slate-700">
                  Год выпуска
                </label>
                <select
                  id="vehicle-year"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  {...register('year', { required: 'Выберите год' })}
                >
                  <option value="">Выберите год</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                {errors.year && (
                  <p className="mt-1 text-xs text-red-600">{errors.year.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" isLoading={isSubmitting}>
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setShowForm(false); reset(); setSelectedMake(''); }}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      {vehicles.length === 0 && !showForm ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
          <Car className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="mb-2 text-lg font-semibold text-slate-900">Гараж пуст</h3>
          <p className="mb-4 text-sm text-slate-500">
            Добавьте автомобиль для быстрого подбора запчастей
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Добавить автомобиль
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-sm text-slate-500">{vehicle.year} г.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(vehicle.id)}
                disabled={deletingId === vehicle.id}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                {deletingId === vehicle.id ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
