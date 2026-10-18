'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem('eat_cookie_ok'));
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  const accept = () => {
    try { localStorage.setItem('eat_cookie_ok', '1'); } catch { /* ignore */ }
    setShow(false);
  };
  return (
    <div role="dialog" aria-label="Бисквитки" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-lg border border-line bg-paper p-4 shadow-2xl shadow-navy-900/15 sm:flex sm:items-center sm:gap-5">
      <p className="text-sm leading-6 text-ink/80">
        Използваме само необходими бисквитки за вход, сравнение и сигурност. Не използваме рекламни бисквитки. Вижте <Link href="/cookies" className="font-semibold text-copper-700 underline">Политиката за бисквитки</Link>.
      </p>
      <Button onClick={accept} size="sm" className="mt-3 shrink-0 sm:mt-0">Разбрах</Button>
    </div>
  );
}
