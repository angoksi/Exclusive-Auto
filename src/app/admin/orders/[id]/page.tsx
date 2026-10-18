import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, Trash2 } from 'lucide-react';
import { ActionForm } from '@/components/admin/action-form';
import { OrderTimeline } from '@/components/order-timeline';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { db } from '@/lib/db';
import { addOrderEvent, deleteOrderEvent, updateOrder, uploadDocument } from '@/lib/actions/admin';
import { STAGES } from '@/lib/stages';
import { dateBg } from '@/lib/format';

export const metadata = { title: 'Поръчка — админ' };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const o = await db.order.findUnique({ where: { id: (await params).id }, include: { events: { orderBy: { createdAt: 'desc' } }, documents: true, user: { select: { name: true, email: true } } } });
  if (!o) notFound();
  return (
    <div className="space-y-8">
      <Link href="/admin/orders" className="text-sm font-semibold text-copper-700">← Всички поръчки</Link>
      <p className="text-sm text-muted">Клиент: <strong className="text-navy-900">{o.user.name}</strong> · {o.user.email}</p>
      <OrderTimeline order={o} showNotes />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6"><h2 className="mb-4 text-lg">Етап и срок</h2>
          <ActionForm action={updateOrder}><><input type="hidden" name="id" value={o.id} />
            <Field label="Текущ етап"><Select name="stage" defaultValue={o.stage}>{STAGES.map((s) => <option key={s.n} value={s.n}>{s.n}. {s.title}</option>)}</Select></Field>
            <Field label="Очаквана дата на доставка"><Input name="estimatedDelivery" type="date" defaultValue={o.estimatedDelivery?.toISOString().slice(0, 10)} /></Field>
            <p className="text-xs text-muted">При промяна на етапа се добавя събитие и клиентът получава известие.</p></></ActionForm></div>
        <div className="card p-6"><h2 className="mb-4 text-lg">Добави събитие / бележка</h2>
          <ActionForm action={addOrderEvent} submit="Добави" variant="copper"><><input type="hidden" name="orderId" value={o.id} />
            <Field label="Заглавие" name="title"><Input name="title" required /></Field>
            <Field label="Бележка"><Textarea name="note" className="min-h-20" /></Field>
            <div className="grid gap-3 sm:grid-cols-3"><Field label="Локация"><Input name="location" /></Field><Field label="Ширина (lat)" name="lat"><Input name="lat" type="number" step="any" /></Field><Field label="Дължина (lng)" name="lng"><Input name="lng" type="number" step="any" /></Field></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublic" defaultChecked className="size-4 accent-[var(--color-copper-600)]" /> Видимо в публичното проследяване (без бележката)</label></></ActionForm></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6"><h2 className="text-lg">Събития</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{o.events.map((e) => <li key={e.id} className="flex items-start justify-between gap-3 py-3"><span><span className="text-xs text-muted">{dateBg(e.createdAt, true)}{e.isPublic ? '' : ' · скрито'}</span><strong className="block text-navy-900">{e.title}</strong>{e.note}</span><form action={deleteOrderEvent.bind(null, e.id)}><Button size="icon" variant="danger" className="size-8" aria-label="Изтрий"><Trash2 /></Button></form></li>)}</ul></div>
        <div className="card p-6"><h2 className="text-lg">Документи</h2>
          <ul className="mt-3 divide-y divide-line text-sm">{o.documents.map((d) => <li key={d.id}><a href={`/api/documents/${d.id}`} className="flex items-center gap-2 py-2 font-semibold text-navy-900 hover:text-copper-700"><FileText className="size-4 text-copper-600" />{d.name}</a></li>)}{o.documents.length === 0 && <li className="py-2 text-muted">Няма документи.</li>}</ul>
          <ActionForm action={uploadDocument} submit="Качи документ" variant="outline" className="mt-5"><><input type="hidden" name="orderId" value={o.id} />
            <Field label="Име на документа"><Input name="name" required placeholder="напр. Договор" /></Field>
            <Field label="Файл (PDF, JPG, PNG до 12 MB)"><Input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required className="h-auto py-2.5" /></Field></></ActionForm></div>
      </div>
    </div>
  );
}
