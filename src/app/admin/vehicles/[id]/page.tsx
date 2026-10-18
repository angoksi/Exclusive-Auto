import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { VehicleForm } from '@/components/admin/vehicle-form';
import { ActionForm } from '@/components/admin/action-form';
import { Photo } from '@/components/photo';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { db } from '@/lib/db';
import { addHistory, addImageUrl, deleteHistory, deleteImage, moveImage } from '@/lib/actions/admin';
import { dateBg, num } from '@/lib/format';

export const metadata = { title: 'Редакция на автомобил — админ' };

export default async function EditVehicle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const v = await db.vehicle.findUnique({ where: { id }, include: { images: { orderBy: { position: 'asc' } }, history: { orderBy: { date: 'desc' } } } });
  if (!v) notFound();
  const created = (await searchParams).created;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-3xl">{v.year} {v.make} {v.model}</h1><Link href={`/catalog/${v.slug}`} target="_blank" className="link-arrow">Виж в сайта →</Link></div>
      {created && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-ok">Автомобилът е създаден. Добавете снимки и история по-долу.</p>}
      <div className="card p-6"><VehicleForm v={v} /></div>

      <section className="card p-6">
        <h2 className="text-lg">Снимки</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Първата снимка е основна. Подредете със стрелките.</p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {v.images.map((im, i) => (
            <li key={im.id} className="overflow-hidden rounded-lg border border-line">
              <Photo src={im.url} alt="" className="aspect-[3/2] w-full" sizes="300px" />
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="text-xs text-muted">{i === 0 ? 'Основна' : `№ ${i + 1}`}</span>
                <div className="flex gap-1">
                  <form action={moveImage.bind(null, im.id, -1)}><Button size="icon" variant="outline" className="size-8" disabled={i === 0} aria-label="Нагоре"><ArrowUp /></Button></form>
                  <form action={moveImage.bind(null, im.id, 1)}><Button size="icon" variant="outline" className="size-8" disabled={i === v.images.length - 1} aria-label="Надолу"><ArrowDown /></Button></form>
                  <form action={deleteImage.bind(null, im.id)}><Button size="icon" variant="danger" className="size-8" aria-label="Изтрий"><Trash2 /></Button></form>
                </div>
              </div>
            </li>
          ))}
          {v.images.length === 0 && <li className="text-sm text-muted">Няма снимки. Качете ги от формата по-горе или добавете https адрес.</li>}
        </ul>
        <ActionForm action={addImageUrl} submit="Добави по адрес" variant="outline" className="mt-5 max-w-xl">
          <><input type="hidden" name="vehicleId" value={v.id} /><Field label="Адрес на снимка (https)" name="url"><Input name="url" type="url" placeholder="https://…" required /></Field></></ActionForm>
      </section>

      <section className="card p-6">
        <h2 className="text-lg">История на автомобила</h2>
        <p className="mb-4 mt-1 text-sm text-muted">Добавяйте само проверими записи от легитимен източник. Не измисляйте история.</p>
        <ul className="divide-y divide-line">
          {v.history.map((h) => (
            <li key={h.id} className="flex items-start justify-between gap-3 py-3 text-sm"><span><span className="text-xs text-muted">{dateBg(h.date)}{h.odometerKm ? ` · ${num(h.odometerKm)} км` : ''}{h.source ? ` · ${h.source}` : ''}</span><strong className="block text-navy-900">{h.type}</strong>{h.description}</span>
              <form action={deleteHistory.bind(null, h.id)}><Button size="icon" variant="danger" className="size-8" aria-label="Изтрий"><Trash2 /></Button></form></li>
          ))}
        </ul>
        <ActionForm action={addHistory} submit="Добави събитие" variant="outline" className="mt-5">
          <>
              <input type="hidden" name="vehicleId" value={v.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Дата" name="date"><Input name="date" type="date" required /></Field>
                <Field label="Тип" name="type"><Input name="type" required placeholder="напр. Предишна продажба" /></Field>
                <Field label="Пробег (км)"><Input name="odometerKm" type="number" min={0} /></Field>
                <Field label="Описание" name="description" className="sm:col-span-2"><Input name="description" required /></Field>
                <Field label="Източник"><Input name="source" placeholder="напр. Copart" /></Field>
              </div>
            </></ActionForm>
      </section>
    </div>
  );
}
