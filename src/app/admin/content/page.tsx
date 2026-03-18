'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';

interface ContentItem {
  key: string;
  value: Record<string, unknown>;
  updatedAt: string;
}

const TABS = [
  { key: 'hero', label: 'Главная — Герой' },
  { key: 'advantages', label: 'Преимущества' },
  { key: 'whatsappCta', label: 'WhatsApp блок' },
  { key: 'about', label: 'О компании' },
  { key: 'contacts', label: 'Контакты' },
  { key: 'delivery', label: 'Доставка и оплата' },
  { key: 'warranty', label: 'Гарантия и возврат' },
  { key: 'footer', label: 'Подвал сайта' },
];

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const [editValue, setEditValue] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content');
      if (res.ok) {
        const json = await res.json();
        setContents(json.data || []);
      }
    } catch {
      toast.error('Ошибка загрузки контента');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  useEffect(() => {
    const item = contents.find((c) => c.key === activeTab);
    if (item) {
      setEditValue(JSON.parse(JSON.stringify(item.value)));
      setDirty(false);
    }
  }, [activeTab, contents]);

  const updateField = (path: string, value: unknown) => {
    setEditValue((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = isNaN(Number(keys[i])) ? keys[i] : Number(keys[i]);
        obj = obj[k];
      }
      const lastKey = isNaN(Number(keys[keys.length - 1]))
        ? keys[keys.length - 1]
        : Number(keys[keys.length - 1]);
      obj[lastKey] = value;
      return next;
    });
    setDirty(true);
  };

  const saveContent = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/${activeTab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: editValue }),
      });
      if (res.ok) {
        toast.success('Сохранено!');
        setDirty(false);
        fetchContents();
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

  const addArrayItem = (path: string, template: Record<string, string>) => {
    setEditValue((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (const k of keys) {
        obj = obj[isNaN(Number(k)) ? k : Number(k)];
      }
      if (Array.isArray(obj)) {
        obj.push({ ...template });
      }
      return next;
    });
    setDirty(true);
  };

  const removeArrayItem = (path: string, index: number) => {
    setEditValue((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (const k of keys) {
        obj = obj[isNaN(Number(k)) ? k : Number(k)];
      }
      if (Array.isArray(obj)) {
        obj.splice(index, 1);
      }
      return next;
    });
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Управление контентом</h1>
        <Button onClick={saveContent} isLoading={saving} disabled={!dirty}>
          <Save className="mr-2 h-4 w-4" />
          Сохранить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              if (dirty) {
                if (!confirm('Есть несохранённые изменения. Переключить вкладку?')) return;
              }
              setActiveTab(tab.key);
            }}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        {activeTab === 'hero' && <HeroEditor value={editValue} onChange={updateField} />}
        {activeTab === 'advantages' && (
          <ArrayEditor
            value={editValue}
            onChange={updateField}
            arrayPath="items"
            fields={[
              { key: 'title', label: 'Заголовок' },
              { key: 'desc', label: 'Описание' },
            ]}
            addLabel="Добавить преимущество"
            onAdd={() => addArrayItem('items', { title: '', desc: '' })}
            onRemove={(i) => removeArrayItem('items', i)}
          />
        )}
        {activeTab === 'whatsappCta' && <WhatsAppEditor value={editValue} onChange={updateField} />}
        {activeTab === 'about' && (
          <AboutEditor
            value={editValue}
            onChange={updateField}
            onAdd={() => addArrayItem('advantages', { title: '', desc: '' })}
            onRemove={(i) => removeArrayItem('advantages', i)}
          />
        )}
        {activeTab === 'contacts' && <ContactsEditor value={editValue} onChange={updateField} />}
        {activeTab === 'delivery' && (
          <DeliveryEditor
            value={editValue}
            onChange={updateField}
            onAddDelivery={() => addArrayItem('deliveryItems', { city: '', time: '', price: '' })}
            onRemoveDelivery={(i) => removeArrayItem('deliveryItems', i)}
            onAddPayment={() => addArrayItem('paymentItems', { name: '', desc: '' })}
            onRemovePayment={(i) => removeArrayItem('paymentItems', i)}
          />
        )}
        {activeTab === 'warranty' && (
          <WarrantyEditor
            value={editValue}
            onChange={updateField}
            onAddExclusion={() => {
              const arr = (editValue.warrantyExclusions as string[]) || [];
              updateField(`warrantyExclusions.${arr.length}`, '');
            }}
            onRemoveExclusion={(i) => removeArrayItem('warrantyExclusions', i)}
            onAddCondition={() => {
              const arr = (editValue.returnConditions as string[]) || [];
              updateField(`returnConditions.${arr.length}`, '');
            }}
            onRemoveCondition={(i) => removeArrayItem('returnConditions', i)}
            onAddStep={() => {
              const arr = (editValue.returnSteps as string[]) || [];
              updateField(`returnSteps.${arr.length}`, '');
            }}
            onRemoveStep={(i) => removeArrayItem('returnSteps', i)}
          />
        )}
        {activeTab === 'footer' && <FooterEditor value={editValue} onChange={updateField} />}
      </div>

      {dirty && (
        <p className="text-sm text-amber-600">
          * Есть несохранённые изменения
        </p>
      )}
    </div>
  );
}

// ─── Editors ────────────────────────────────────────────

interface EditorProps {
  value: Record<string, unknown>;
  onChange: (path: string, value: unknown) => void;
}

function Field({
  label,
  path,
  value,
  onChange,
  textarea,
}: {
  label: string;
  path: string;
  value: Record<string, unknown>;
  onChange: (path: string, v: unknown) => void;
  textarea?: boolean;
}) {
  const keys = path.split('.');
  let v: unknown = value;
  for (const k of keys) {
    v = (v as Record<string, unknown>)?.[isNaN(Number(k)) ? k : Number(k) as unknown as string];
  }

  if (textarea) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
        <textarea
          value={(v as string) || ''}
          onChange={(e) => onChange(path, e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
    );
  }

  return (
    <Input
      label={label}
      value={(v as string) || ''}
      onChange={(e) => onChange(path, e.target.value)}
    />
  );
}

function HeroEditor({ value, onChange }: EditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Главный баннер</h3>
      <Field label="Заголовок" path="title" value={value} onChange={onChange} />
      <Field label="Подзаголовок" path="subtitle" value={value} onChange={onChange} />
      <Field label="Placeholder поиска" path="searchPlaceholder" value={value} onChange={onChange} />
    </div>
  );
}

function WhatsAppEditor({ value, onChange }: EditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">WhatsApp CTA блок</h3>
      <Field label="Заголовок" path="title" value={value} onChange={onChange} />
      <Field label="Подзаголовок" path="subtitle" value={value} onChange={onChange} textarea />
      <Field label="Текст кнопки" path="buttonText" value={value} onChange={onChange} />
    </div>
  );
}

function AboutEditor({
  value,
  onChange,
  onAdd,
  onRemove,
}: EditorProps & { onAdd: () => void; onRemove: (i: number) => void }) {
  const advantages = (value.advantages as { title: string; desc: string }[]) || [];
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">О компании</h3>
      <Field label="Заголовок" path="title" value={value} onChange={onChange} />
      <Field label="Вступительный текст" path="intro" value={value} onChange={onChange} textarea />
      <div className="border-t border-slate-200 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-medium text-slate-700">Преимущества</h4>
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus className="mr-1 h-3 w-3" /> Добавить
          </Button>
        </div>
        {advantages.map((item, i) => (
          <div key={i} className="mb-3 flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <GripVertical className="mt-2 h-4 w-4 flex-shrink-0 text-slate-300" />
            <div className="flex-1 space-y-2">
              <Field label="Заголовок" path={`advantages.${i}.title`} value={value} onChange={onChange} />
              <Field label="Описание" path={`advantages.${i}.desc`} value={value} onChange={onChange} textarea />
            </div>
            <button onClick={() => onRemove(i)} className="mt-2 text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsEditor({ value, onChange }: EditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Контакты</h3>
      <Field label="Заголовок страницы" path="title" value={value} onChange={onChange} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Телефон" path="phone" value={value} onChange={onChange} />
        <Field label="Описание телефона" path="phoneDesc" value={value} onChange={onChange} />
        <Field label="WhatsApp описание" path="whatsappDesc" value={value} onChange={onChange} />
        <Field label="Email" path="email" value={value} onChange={onChange} />
        <Field label="Описание email" path="emailDesc" value={value} onChange={onChange} />
        <Field label="Режим работы" path="workingHours" value={value} onChange={onChange} />
        <Field label="Примечание к режиму" path="workingHoursNote" value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function DeliveryEditor({
  value,
  onChange,
  onAddDelivery,
  onRemoveDelivery,
  onAddPayment,
  onRemovePayment,
}: EditorProps & {
  onAddDelivery: () => void;
  onRemoveDelivery: (i: number) => void;
  onAddPayment: () => void;
  onRemovePayment: (i: number) => void;
}) {
  const deliveryItems = (value.deliveryItems as { city: string; time: string; price: string }[]) || [];
  const paymentItems = (value.paymentItems as { name: string; desc: string }[]) || [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Доставка и оплата</h3>
      <Field label="Заголовок страницы" path="title" value={value} onChange={onChange} />

      {/* Delivery */}
      <div className="border-t border-slate-200 pt-4">
        <Field label="Заголовок доставки" path="deliveryTitle" value={value} onChange={onChange} />
        <div className="mt-3 mb-2 flex items-center justify-between">
          <h4 className="font-medium text-slate-700">Города доставки</h4>
          <Button variant="outline" size="sm" onClick={onAddDelivery}>
            <Plus className="mr-1 h-3 w-3" /> Добавить
          </Button>
        </div>
        {deliveryItems.map((item, i) => (
          <div key={i} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="grid flex-1 grid-cols-3 gap-2">
              <Field label="Город" path={`deliveryItems.${i}.city`} value={value} onChange={onChange} />
              <Field label="Срок" path={`deliveryItems.${i}.time`} value={value} onChange={onChange} />
              <Field label="Цена" path={`deliveryItems.${i}.price`} value={value} onChange={onChange} />
            </div>
            <button onClick={() => onRemoveDelivery(i)} className="mt-5 text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Field label="Примечание о доставке" path="deliveryNote" value={value} onChange={onChange} textarea />
      </div>

      {/* Payment */}
      <div className="border-t border-slate-200 pt-4">
        <Field label="Заголовок оплаты" path="paymentTitle" value={value} onChange={onChange} />
        <div className="mt-3 mb-2 flex items-center justify-between">
          <h4 className="font-medium text-slate-700">Способы оплаты</h4>
          <Button variant="outline" size="sm" onClick={onAddPayment}>
            <Plus className="mr-1 h-3 w-3" /> Добавить
          </Button>
        </div>
        {paymentItems.map((item, i) => (
          <div key={i} className="mb-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
            <div className="grid flex-1 grid-cols-2 gap-2">
              <Field label="Название" path={`paymentItems.${i}.name`} value={value} onChange={onChange} />
              <Field label="Описание" path={`paymentItems.${i}.desc`} value={value} onChange={onChange} />
            </div>
            <button onClick={() => onRemovePayment(i)} className="mt-5 text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Field label="Примечание об оплате" path="paymentNote" value={value} onChange={onChange} textarea />
      </div>
    </div>
  );
}

function WarrantyEditor({
  value,
  onChange,
  onAddExclusion,
  onRemoveExclusion,
  onAddCondition,
  onRemoveCondition,
  onAddStep,
  onRemoveStep,
}: EditorProps & {
  onAddExclusion: () => void;
  onRemoveExclusion: (i: number) => void;
  onAddCondition: () => void;
  onRemoveCondition: (i: number) => void;
  onAddStep: () => void;
  onRemoveStep: (i: number) => void;
}) {
  const exclusions = (value.warrantyExclusions as string[]) || [];
  const conditions = (value.returnConditions as string[]) || [];
  const steps = (value.returnSteps as string[]) || [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-slate-900">Гарантия и возврат</h3>
      <Field label="Заголовок страницы" path="title" value={value} onChange={onChange} />

      {/* Warranty */}
      <div className="border-t border-slate-200 pt-4">
        <Field label="Заголовок гарантии" path="warrantyTitle" value={value} onChange={onChange} />
        <div className="mt-2">
          <Field label="Текст о гарантии" path="warrantyIntro" value={value} onChange={onChange} textarea />
        </div>
        <div className="mt-3 mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">Гарантия не распространяется на:</h4>
          <Button variant="outline" size="sm" onClick={onAddExclusion}>
            <Plus className="mr-1 h-3 w-3" /> Добавить
          </Button>
        </div>
        {exclusions.map((item, i) => (
          <div key={i} className="mb-1 flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => onChange(`warrantyExclusions.${i}`, e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <button onClick={() => onRemoveExclusion(i)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Return */}
      <div className="border-t border-slate-200 pt-4">
        <Field label="Заголовок возврата" path="returnTitle" value={value} onChange={onChange} />
        <div className="mt-2">
          <Field label="Текст о возврате" path="returnIntro" value={value} onChange={onChange} textarea />
        </div>

        <div className="mt-3 mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">Условия возврата:</h4>
          <Button variant="outline" size="sm" onClick={onAddCondition}>
            <Plus className="mr-1 h-3 w-3" /> Добавить
          </Button>
        </div>
        {conditions.map((item, i) => (
          <div key={i} className="mb-1 flex items-center gap-2">
            <input
              value={item}
              onChange={(e) => onChange(`returnConditions.${i}`, e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <button onClick={() => onRemoveCondition(i)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <div className="mt-3 mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium text-slate-700">Шаги возврата:</h4>
          <Button variant="outline" size="sm" onClick={onAddStep}>
            <Plus className="mr-1 h-3 w-3" /> Добавить
          </Button>
        </div>
        {steps.map((item, i) => (
          <div key={i} className="mb-1 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
              {i + 1}
            </span>
            <input
              value={item}
              onChange={(e) => onChange(`returnSteps.${i}`, e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none"
            />
            <button onClick={() => onRemoveStep(i)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterEditor({ value, onChange }: EditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900">Подвал сайта</h3>
      <Field label="Описание компании" path="companyDesc" value={value} onChange={onChange} textarea />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Email" path="email" value={value} onChange={onChange} />
        <Field label="Адрес" path="address" value={value} onChange={onChange} />
        <Field label="Копирайт" path="copyright" value={value} onChange={onChange} />
        <Field label="Примечание о ценах" path="priceNote" value={value} onChange={onChange} />
      </div>
    </div>
  );
}

function ArrayEditor({
  value,
  onChange,
  arrayPath,
  fields,
  addLabel,
  onAdd,
  onRemove,
}: EditorProps & {
  arrayPath: string;
  fields: { key: string; label: string; textarea?: boolean }[];
  addLabel: string;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  const items = (value[arrayPath] as Record<string, string>[]) || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Преимущества</h3>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="mr-1 h-3 w-3" /> {addLabel}
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <GripVertical className="mt-2 h-4 w-4 flex-shrink-0 text-slate-300" />
          <div className="flex-1 space-y-2">
            {fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                path={`${arrayPath}.${i}.${f.key}`}
                value={value}
                onChange={onChange}
                textarea={f.textarea}
              />
            ))}
          </div>
          <button onClick={() => onRemove(i)} className="mt-2 text-red-400 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
