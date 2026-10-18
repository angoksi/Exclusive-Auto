import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { Photo } from '@/components/photo';
import { InquiryForm } from '@/components/inquiry-form';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeVin, vinChecksumValid, vinFormatError, vinYearCandidates } from '@/lib/vin';
import { fetchExternalHistory, isHistoryConfigured } from '@/lib/vin-provider';
import { CONDITION_LABEL, REGION_LABEL, SOURCE_LABEL, dateBg, eur, kmToMi, num } from '@/lib/format';

export const metadata: Metadata = {
  title: 'VIN проверка — история и данни за автомобил',
  description: 'Проверете VIN номер: валидност, марка, модел, година, аукционна история и налични данни за повреди.',
  alternates: { canonical: '/vin-check' },
};

const WMI: Record<string, string> = { '1': 'САЩ', '2': 'Канада', '3': 'Мексико', '4': 'САЩ', '5': 'САЩ', J: 'Япония', K: 'Южна Корея', L: 'Китай', S: 'Великобритания', V: 'Франция/Испания', W: 'Германия', Y: 'Швеция/Финландия', Z: 'Италия' };

export default async function VinCheck({ searchParams }: { searchParams: Promise<{ vin?: string }> }) {
  const raw = (await searchParams).vin;
  const vin = raw ? normalizeVin(raw.slice(0, 40)) : '';
  const user = await getUser();
  const demoVins = await db.vehicle.findMany({ where: { isDemo: true, vin: { not: null } }, select: { vin: true }, take: 3 });

  let content: React.ReactNode = null;
  if (vin) {
    if (!(await rateLimit('vin', 15, 60_000))) {
      content = <Notice tone="warn" title="Твърде много проверки">Опитайте отново след минута.</Notice>;
    } else {
      const err = vinFormatError(vin);
      if (err) content = <Notice tone="danger" title="Невалиден VIN">{err}</Notice>;
      else {
        const [vehicle, external] = await Promise.all([
          db.vehicle.findFirst({ where: { vin }, include: { images: { orderBy: { position: 'asc' }, take: 4 }, history: { orderBy: { date: 'desc' } } } }),
          fetchExternalHistory(vin),
        ]);
        const checksum = vinChecksumValid(vin);
        const years = vinYearCandidates(vin);
        content = (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg">Резултат за <span className="font-mono tracking-wider">{vin}</span></h2>
              <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />Форматът е валиден (17 символа)</li>
                <li className="flex items-start gap-2">{checksum ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />}{checksum ? 'Контролната цифра съвпада' : 'Контролната цифра не съвпада (нормално за автомобили извън Северна Америка)'}</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />Регион по WMI: {WMI[vin[0]] ?? 'неопределен'}{years.length ? ` · възможна година ${years.join(' / ')}` : ''}</li>
              </ul>
            </div>

            {vehicle ? (
              <div className="card overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[320px_1fr]">
                  <Photo src={vehicle.images[0]?.url} alt={`${vehicle.make} ${vehicle.model}`} className="aspect-[3/2] w-full md:h-full md:aspect-auto" />
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2"><Badge tone="navy">В нашата база</Badge>{vehicle.isDemo && <Badge tone="warn">Демонстрационни данни</Badge>}</div>
                    <h3 className="mt-3 text-2xl">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}</h3>
                    <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                      {[['Платформа', vehicle.platform ?? SOURCE_LABEL[vehicle.source]], ['Лот', vehicle.lotNumber ?? '—'], ['Локация', `${vehicle.location}, ${REGION_LABEL[vehicle.region]}`], ['Пробег', `${num(vehicle.odometerKm)} км (${num(kmToMi(vehicle.odometerKm))} ми)`], ['Състояние', CONDITION_LABEL[vehicle.condition]], ['Основна повреда', vehicle.primaryDamage ?? 'Няма докладвана'], ['Дата на търга', dateBg(vehicle.auctionDate)], ['Цена', vehicle.priceEur ? eur(vehicle.priceEur) : '—']].map(([k, val]) => (
                        <div key={k} className="flex justify-between gap-4 border-b border-line pb-2"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold text-navy-900">{val}</dd></div>
                      ))}
                    </dl>
                    <Button asChild variant="outline" className="mt-6"><Link href={`/catalog/${vehicle.slug}`}>Към обявата</Link></Button>
                  </div>
                </div>
                {vehicle.history.length > 0 && (
                  <div className="border-t border-line p-6">
                    <h3 className="text-lg">История от нашата база</h3>
                    <ol className="mt-4 space-y-0 border-l-2 border-line pl-6">
                      {vehicle.history.map((h) => (
                        <li key={h.id} className="relative pb-5 last:pb-0"><span className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-copper-600 bg-paper" /><p className="text-xs text-muted">{dateBg(h.date)}{h.odometerKm ? ` · ${num(h.odometerKm)} км` : ''}{h.source ? ` · ${h.source}` : ''}</p><p className="font-semibold text-navy-900">{h.type}</p><p className="text-sm text-ink/75">{h.description}</p></li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <Notice tone="neutral" title="Няма запис в нашата база">
                Този VIN не фигурира в обявите ни. Ако имате конкретен автомобил, консултант може да поиска пълен доклад за него от лицензиран доставчик.
              </Notice>
            )}

            {external && external.events.length > 0 && (
              <div className="card p-6">
                <h3 className="text-lg">История от {external.provider}</h3>
                <ul className="mt-4 divide-y divide-line text-sm">{external.events.map((e, i) => <li key={i} className="py-3"><span className="text-muted">{dateBg(e.date)}</span> · <strong className="text-navy-900">{e.type}</strong> — {e.description}</li>)}</ul>
              </div>
            )}
            {!isHistoryConfigured() && (
              <p className="rounded-md border border-dashed border-line bg-paper p-4 text-sm text-muted">
                <strong className="text-navy-900">Демонстрационен режим.</strong> Не е свързан външен доставчик на VIN история, затова се показват само данни от собствената ни база. Не се генерират или предполагат исторически записи.
              </p>
            )}

            <div className="card p-6">
              <h3 className="text-lg">Искате пълен доклад?</h3>
              <p className="mb-4 mt-1 text-sm text-muted">Оставете запитване и ще проверим автомобила чрез легитимен доставчик на история.</p>
              <InquiryForm type="CONTACT" user={user} defaultMessage={`Моля за пълен доклад за VIN ${vin}.`} submitLabel="Заявявам доклад" />
            </div>
          </div>
        );
      }
    }
  }

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x py-14">
          <p className="eyebrow">VIN проверка</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Проверете автомобила по VIN</h1>
          <p className="mt-3 max-w-2xl text-muted">Валидираме номера, разпознаваме региона и годината и търсим в наличните данни — аукционна история, предишни продажби, снимки и повреди, когато имаме право да ги предоставим.</p>
          <form action="/vin-check" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <Input name="vin" defaultValue={vin} placeholder="Въведете 17-символен VIN" maxLength={40} className="h-12 font-mono uppercase tracking-wider" aria-label="VIN номер" required />
            <Button size="lg" variant="copper" type="submit"><Search /> Провери</Button>
          </form>
          {!vin && demoVins.length > 0 && (
            <p className="mt-4 text-sm text-muted">Демо VIN номера за изпробване: {demoVins.map((d, i) => <span key={d.vin}>{i > 0 && ', '}<Link href={`/vin-check?vin=${d.vin}`} className="font-mono font-semibold text-copper-700 underline">{d.vin}</Link></span>)}</p>
          )}
        </div>
      </section>
      {content && <div className="container-x max-w-4xl py-10">{content}</div>}
    </>
  );
}

function Notice({ tone, title, children }: { tone: 'warn' | 'danger' | 'neutral'; title: string; children: React.ReactNode }) {
  const c = { warn: 'border-amber-200 bg-amber-50 text-amber-900', danger: 'border-red-200 bg-red-50 text-red-900', neutral: 'border-line bg-paper text-ink' }[tone];
  return <div role="alert" className={`rounded-lg border p-5 ${c}`}><p className="font-bold">{title}</p><p className="mt-1 text-sm">{children}</p></div>;
}
