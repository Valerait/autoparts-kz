import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-lg font-bold text-white">
              A
            </div>
            <span className="text-xl font-bold text-slate-900">АвтоЗапчасти</span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {children}
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-slate-500 transition-colors hover:text-primary-600">
            &larr; Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
