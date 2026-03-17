import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'АвтоЗапчасти — Интернет-магазин автозапчастей в Казахстане',
    template: '%s | АвтоЗапчасти',
  },
  description: 'Интернет-магазин оригинальных и аналоговых автозапчастей. Поиск по каталожному номеру, подбор по авто. Доставка по всему Казахстану.',
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col">
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  );
}
