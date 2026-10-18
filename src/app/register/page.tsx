import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { Logo } from '@/components/logo';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Регистрация', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getUser()) redirect(next?.startsWith('/') && !next.startsWith('//') ? next : '/account');
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="card p-8">
          <h1 className="text-2xl">Създайте профил</h1>
          <p className="mb-6 mt-1 text-sm text-muted">Запазвайте автомобили, получавайте оферти и следете доставките си.</p>
          <AuthForm mode="register" next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">Вече имате профил? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-copper-700 underline">Вход</Link></p>
      </div>
    </div>
  );
}
