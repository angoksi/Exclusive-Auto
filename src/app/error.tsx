'use client';
import { Button } from '@/components/ui/button';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">Нещо се обърка</p>
        <h1 className="mt-3 text-3xl">Възникна неочаквана грешка</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">Опитайте отново. Ако проблемът продължава, свържете се с нас.</p>
        <Button onClick={reset} className="mt-8">Опитай отново</Button>
      </div>
    </div>
  );
}
