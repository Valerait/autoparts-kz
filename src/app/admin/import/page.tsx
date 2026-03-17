'use client';

import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  X,
  Loader2,
} from 'lucide-react';

interface ImportResult {
  totalRows: number;
  success: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const validExts = ['.csv', '.xls', '.xlsx'];
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();

    if (!validTypes.includes(f.type) && !validExts.includes(ext)) {
      toast.error('Поддерживаются только файлы CSV и Excel');
      return;
    }
    setFile(f);
    setResult(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dryRun', dryRun.toString());

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (res.ok) {
        setResult(json.data);
        if (!dryRun && json.data.errors.length === 0) {
          toast.success(`Импорт завершён: ${json.data.success} записей`);
        }
      } else {
        toast.error(json.error || 'Ошибка импорта');
      }
    } catch {
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Импорт товаров</h1>

      {/* Upload area */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors',
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center gap-3">
              <FileSpreadsheet className="h-12 w-12 text-green-500" />
              <div>
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setResult(null);
                }}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Удалить файл
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-12 w-12 text-slate-400" />
              <div>
                <p className="font-medium text-slate-700">
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="text-sm text-slate-400">CSV или Excel (.csv, .xls, .xlsx)</p>
              </div>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-700">Тестовый запуск (без сохранения)</span>
          </label>

          <div className="flex gap-3">
            <a
              href="/api/admin/import/template"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Скачать шаблон
            </a>
            <Button onClick={handleUpload} disabled={!file || uploading} isLoading={uploading}>
              {dryRun ? 'Проверить' : 'Импортировать'}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <FileSpreadsheet className="h-8 w-8 text-slate-400" />
              <div>
                <p className="text-sm text-slate-500">Всего строк</p>
                <p className="text-xl font-bold text-slate-900">{result.totalRows}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-500">Успешно</p>
                <p className="text-xl font-bold text-green-600">{result.success}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-slate-500">Ошибок</p>
                <p className="text-xl font-bold text-red-600">{result.errors.length}</p>
              </div>
            </div>
          </div>

          {/* Errors table */}
          {result.errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-white">
              <div className="border-b border-red-100 px-5 py-3">
                <h3 className="font-semibold text-red-800">Ошибки импорта</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-100 bg-red-50 text-left">
                      <th className="px-5 py-2 font-medium text-red-700">Строка</th>
                      <th className="px-5 py-2 font-medium text-red-700">Поле</th>
                      <th className="px-5 py-2 font-medium text-red-700">Ошибка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((err, i) => (
                      <tr key={i} className="border-b border-red-50">
                        <td className="px-5 py-2 font-medium text-slate-900">{err.row}</td>
                        <td className="px-5 py-2 text-slate-600">{err.field}</td>
                        <td className="px-5 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dryRun && result.errors.length === 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="font-medium text-green-800">
                Проверка пройдена успешно! Снимите галочку &quot;Тестовый запуск&quot; и нажмите
                &quot;Импортировать&quot; для сохранения данных.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
