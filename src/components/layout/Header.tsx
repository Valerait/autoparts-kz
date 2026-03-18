'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useEffect, useState } from 'react';
import { Search, ShoppingCart, User, Menu, X, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, fetchUser } = useAuth();
  const { items, fetchCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
    fetchCart();
  }, [fetchUser, fetchCart]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+79001234567';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top bar */}
      <div className="border-b border-slate-100 bg-slate-50">
        <div className="container-main flex items-center justify-between py-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <a href={`tel:${whatsappNumber}`} className="flex items-center gap-1 hover:text-primary-600">
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">{whatsappNumber}</span>
            </a>
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-whatsapp hover:text-green-700"
            >
              <MessageCircle className="h-3 w-3" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
          </div>
          <div className="text-slate-500">Доставка по всему Казахстану</div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-main py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-xl font-bold text-primary-700">
              Авто<span className="text-accent-500">Запчасти</span>
            </span>
          </Link>

          {/* Search - desktop */}
          <form onSubmit={handleSearch} className="hidden flex-1 md:flex">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по каталожному номеру, артикулу, названию..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-4 pr-12 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 rounded-md bg-primary-600 p-2 text-white transition-colors hover:bg-primary-700"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/account/profile" className="hidden items-center gap-1 text-sm text-slate-700 hover:text-primary-600 sm:flex">
                <User className="h-5 w-5" />
                <span className="hidden lg:inline">{user.name || 'Кабинет'}</span>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4" />
                  <span className="hidden lg:inline">Войти</span>
                </Button>
              </Link>
            )}

            <Link href="/cart" className="relative flex items-center gap-1 rounded-lg p-2 text-slate-700 hover:bg-slate-100">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              <span className="hidden text-sm lg:inline">Корзина</span>
            </Link>

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 md:hidden">
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Search - mobile */}
        <form onSubmit={handleSearch} className="mt-3 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по номеру, артикулу..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-4 pr-12 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button type="submit" className="absolute right-1 top-1 rounded-md bg-primary-600 p-2 text-white">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Navigation */}
      <nav className="hidden border-t border-slate-100 md:block">
        <div className="container-main flex items-center gap-6 py-2 text-sm">
          <Link href="/categories" className="text-slate-700 hover:text-primary-600">Каталог</Link>
          <Link href="/brands" className="text-slate-700 hover:text-primary-600">Бренды</Link>
          <Link href="/search" className="text-slate-700 hover:text-primary-600">Подбор по авто</Link>
          <Link href="/about" className="text-slate-700 hover:text-primary-600">О компании</Link>
          <Link href="/contacts" className="text-slate-700 hover:text-primary-600">Контакты</Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <Link href="/categories" className="text-slate-700" onClick={() => setMobileMenuOpen(false)}>Каталог</Link>
            <Link href="/brands" className="text-slate-700" onClick={() => setMobileMenuOpen(false)}>Бренды</Link>
            <Link href="/search" className="text-slate-700" onClick={() => setMobileMenuOpen(false)}>Подбор по авто</Link>
            {user ? (
              <>
                <Link href="/account/profile" className="text-slate-700" onClick={() => setMobileMenuOpen(false)}>Личный кабинет</Link>
                <Link href="/account/orders" className="text-slate-700" onClick={() => setMobileMenuOpen(false)}>Мои заказы</Link>
              </>
            ) : (
              <Link href="/login" className="text-primary-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
            )}
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-whatsapp font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              Написать в WhatsApp
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
