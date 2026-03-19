import Link from 'next/link';
import { ChevronRight, Shield, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getContent } from '@/lib/content';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Гарантия и возврат — АвтоЗапчасти КЗ',
  description: 'Условия гарантии и возврата автозапчастей. Порядок обмена и возврата товара.',
};

interface WarrantyContent {
  title: string;
  warrantyTitle: string;
  warrantyIntro: string;
  warrantyExclusions: string[];
  returnTitle: string;
  returnIntro: string;
  returnConditions: string[];
  returnSteps: string[];
}

export default async function WarrantyPage() {
  const warranty = await getContent<WarrantyContent>('warranty');

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Главная</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-slate-900">{warranty.title}</span>
      </nav>

      <h1 className="mb-8 text-2xl font-bold text-slate-900 sm:text-3xl">{warranty.title}</h1>

      <div className="space-y-8">
        {/* Warranty */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <Shield className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{warranty.warrantyTitle}</h2>
          </div>
          {warranty.warrantyIntro && (
            <div className="prose prose-slate max-w-none text-slate-600">
              <p>{warranty.warrantyIntro}</p>
            </div>
          )}
          {warranty.warrantyExclusions && warranty.warrantyExclusions.length > 0 && (
            <div className="mt-3 space-y-2">
              {warranty.warrantyExclusions.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Return */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
              <RotateCcw className="h-5 w-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{warranty.returnTitle}</h2>
          </div>
          {warranty.returnIntro && (
            <div className="text-slate-600 text-sm mb-4">{warranty.returnIntro}</div>
          )}
          {warranty.returnConditions && warranty.returnConditions.length > 0 && (
            <div className="space-y-2">
              {warranty.returnConditions.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* How to return */}
        {warranty.returnSteps && warranty.returnSteps.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-900">Как оформить возврат</h2>
            <div className="space-y-3">
              {warranty.returnSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {i + 1}
                  </div>
                  <span className="text-sm text-slate-600 mt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
          Остались вопросы?{' '}
          <Link href="/contacts" className="font-medium text-primary-600 hover:text-primary-700">
            Свяжитесь с нами →
          </Link>
        </div>
      </div>
    </div>
  );
}
