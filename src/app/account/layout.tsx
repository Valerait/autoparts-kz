'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Heart, Car } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const navItems = [
  { href: '/account/profile', label: 'Профиль', icon: User },
  { href: '/account/orders', label: 'Заказы', icon: Package },
  { href: '/account/favorites', label: 'Избранное', icon: Heart },
  { href: '/account/vehicles', label: 'Мой гараж', icon: Car },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="flex flex-1 items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
        </main>
        <Footer />
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <main className="flex-1 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-slate-900 sm:text-3xl">Личный кабинет</h1>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar - desktop */}
            <aside className="hidden w-60 shrink-0 lg:block">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile nav - horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
