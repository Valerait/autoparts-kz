'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SearchBoxProps {
  large?: boolean;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchBox({ large, placeholder, defaultValue = '' }: SearchBoxProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`relative flex ${large ? 'max-w-3xl' : 'max-w-xl'}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || 'Введите каталожный номер, артикул или название...'}
          className={`w-full rounded-l-xl border border-r-0 border-slate-300 ${
            large ? 'py-4 pl-6 pr-4 text-lg' : 'py-3 pl-4 pr-4 text-sm'
          } transition-colors placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500`}
        />
        <Button
          type="submit"
          size={large ? 'lg' : 'md'}
          className={`rounded-l-none rounded-r-xl ${large ? 'px-8' : 'px-6'}`}
        >
          <Search className={large ? 'h-5 w-5' : 'h-4 w-4'} />
          <span className="hidden sm:inline">Найти</span>
        </Button>
      </div>
    </form>
  );
}
