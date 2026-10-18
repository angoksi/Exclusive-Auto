import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { Logo } from '@/components/logo';
import { getUser } from '@/lib/auth';

export const metadata: Metadata = { title: 'Вход', robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getUser()) redirect(next?.startsWith('/') && !next.startsWith('//') ? next : '/account');
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="card p-8">
          <h1 className="text-2xl">Добре дошли отново</h1>
          <p className="mb-6 mt-1 text-sm text-muted">Влезте, за да видите любими, оферти и поръчки.</p>
          <AuthForm mode="login" next={next} />
        </div>
        <p className="mt-6 text-center text-sm text-muted">Нямате профил? <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-copper-700 underline">Регистрация</Link></p>
      </div>
    </div>
  );
}
