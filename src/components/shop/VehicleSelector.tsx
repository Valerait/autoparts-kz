'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Car } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Make { id: string; name: string; slug: string }
interface Model { id: string; name: string; slug: string }
interface Year { id: string; year: number }

export function VehicleSelector() {
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((d) => setMakes(d.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    fetch(`/api/vehicles?makeId=${selectedMake}`)
      .then((r) => r.json())
      .then((d) => setModels(d.data || []))
      .catch(() => {});
    setSelectedModel('');
    setSelectedYear('');
  }, [selectedMake]);

  useEffect(() => {
    if (!selectedModel) { setYears([]); return; }
    fetch(`/api/vehicles?modelId=${selectedModel}`)
      .then((r) => r.json())
      .then((d) => setYears(d.data || []))
      .catch(() => {});
    setSelectedYear('');
  }, [selectedModel]);

  const handleSearch = () => {
    if (selectedMake && selectedModel) {
      const params = new URLSearchParams({
        makeId: selectedMake,
        modelId: selectedModel,
        ...(selectedYear && { year: selectedYear }),
      });
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-2">
        <Car className="h-5 w-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-900">Подбор по автомобилю</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <select
          value={selectedMake}
          onChange={(e) => setSelectedMake(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Марка</option>
          {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          disabled={!selectedMake}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
        >
          <option value="">Модель</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          disabled={!selectedModel}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50"
        >
          <option value="">Год</option>
          {years.map((y) => <option key={y.id} value={y.year.toString()}>{y.year}</option>)}
        </select>
        <Button onClick={handleSearch} disabled={!selectedMake || !selectedModel} className="w-full">
          Подобрать запчасти
        </Button>
      </div>
    </div>
  );
}
