'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function MobileNav({ links, loggedIn }: { links: { href: string; label: string }[]; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" aria-expanded={open} aria-label={open ? 'Затвори менюто' : 'Отвори менюто'} onClick={() => setOpen(!open)} className="grid size-10 place-items-center rounded-md hover:bg-mist">
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div className="fixed inset-x-0 top-[68px] z-50 max-h-[calc(100dvh-68px)] overflow-y-auto border-t border-line bg-paper p-4 shadow-xl">
          <nav className="grid gap-1" aria-label="Мобилна навигация">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-[15px] font-semibold text-navy-900 hover:bg-mist">{l.label}</Link>
            ))}
            <Link href={loggedIn ? '/account' : '/login'} onClick={() => setOpen(false)} className="mt-2 rounded-md bg-navy-900 px-3 py-3 text-center text-[15px] font-semibold text-white">
              {loggedIn ? 'Моят профил' : 'Вход / Регистрация'}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
