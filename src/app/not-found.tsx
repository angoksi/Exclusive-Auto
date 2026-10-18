import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">Грешка 404</p>
        <h1 className="mt-3 text-4xl">Страницата не е намерена</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">Адресът може да е променен или автомобилът вече да не е наличен.</p>
        <Button asChild className="mt-8"><Link href="/catalog">Към каталога</Link></Button>
      </div>
    </div>
  );
}
