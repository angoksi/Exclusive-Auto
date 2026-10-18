import { Trash2 } from 'lucide-react';
import { ActionForm } from '@/components/admin/action-form';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { db } from '@/lib/db';
import { requireRole, STAFF } from '@/lib/auth';
import { deleteDelivery, deleteReview, saveDelivery, saveReview, saveSite } from '@/lib/actions/admin';
import { getSiteInfo } from '@/lib/site';

export const metadata = { title: 'Съдържание — админ' };

function ReviewForm({ r }: { r?: { id: string; author: string; city: string | null; vehicle: string | null; rating: number; text: string; published: boolean; isDemo: boolean } }) {
  return (
    <ActionForm action={saveReview} submit={r ? 'Запази' : 'Добави отзив'} variant={r ? 'primary' : 'copper'}>
      <>
        {r && <input type="hidden" name="id" value={r.id} />}
        <div className="grid gap-3 sm:grid-cols-4"><Field label="Автор" name="author"><Input name="author" defaultValue={r?.author} required /></Field><Field label="Град"><Input name="city" defaultValue={r?.city ?? ''} /></Field><Field label="Автомобил"><Input name="vehicle" defaultValue={r?.vehicle ?? ''} /></Field><Field label="Оценка"><Select name="rating" defaultValue={r?.rating ?? 5}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</Select></Field></div>
        <Field label="Текст" name="text"><Textarea name="text" defaultValue={r?.text} required className="min-h-20" /></Field>
        <div className="flex gap-6 text-sm"><label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={r?.published ?? true} className="size-4 accent-[var(--color-copper-600)]" />Публикуван</label><label className="flex items-center gap-2"><input type="checkbox" name="isDemo" defaultChecked={r?.isDemo ?? false} className="size-4 accent-[var(--color-copper-600)]" />Примерен (показва се белег „Примерен“)</label></div>
      </></ActionForm>
  );
}

function DeliveryForm({ d }: { d?: { id: string; title: string; year: number; origin: 'US' | 'CA' | 'KR'; days: number; city: string | null; deliveredAt: Date; isDemo: boolean } }) {
  return (
    <ActionForm action={saveDelivery} submit={d ? 'Запази' : 'Добави доставка'} variant={d ? 'primary' : 'copper'}>
      <>
        {d && <input type="hidden" name="id" value={d.id} />}
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Автомобил" name="title"><Input name="title" defaultValue={d?.title} required /></Field><Field label="Година"><Input name="year" type="number" defaultValue={d?.year ?? 2022} required /></Field>
          <input type="hidden" name="origin" value="KR" />
          <Field label="Дни до предаване"><Input name="days" type="number" min={1} defaultValue={d?.days ?? 50} required /></Field><Field label="Град"><Input name="city" defaultValue={d?.city ?? ''} /></Field>
          <Field label="Предадена на" name="deliveredAt"><Input name="deliveredAt" type="date" defaultValue={d?.deliveredAt.toISOString().slice(0, 10)} required /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isDemo" defaultChecked={d?.isDemo ?? false} className="size-4 accent-[var(--color-copper-600)]" />Примерна доставка (белег „Демо“)</label>
      </></ActionForm>
  );
}

export default async function AdminContent() {
  const user = await requireRole(STAFF);
  const [reviews, deliveries, site] = await Promise.all([db.review.findMany({ orderBy: { createdAt: 'desc' } }), db.completedDelivery.findMany({ orderBy: { deliveredAt: 'desc' } }), getSiteInfo()]);
  return (
    <div className="space-y-10">
      <h1 className="text-3xl">Отзиви, доставки и контакти</h1>
      {user.role === 'ADMIN' && (
        <section className="card max-w-2xl p-6"><h2 className="mb-4 text-lg">Контактна информация</h2>
          <ActionForm action={saveSite}><>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="Телефон" name="phone"><Input name="phone" defaultValue={site.phone} required /></Field><Field label="Имейл" name="email"><Input name="email" type="email" defaultValue={site.email} required /></Field><Field label="Адрес"><Input name="address" defaultValue={site.address} required /></Field><Field label="Работно време"><Input name="hours" defaultValue={site.hours} required /></Field></div></></ActionForm></section>
      )}
      <section className="space-y-4"><h2 className="text-xl">Отзиви</h2>
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Публикувайте само истински отзиви с разрешение на авторите. Примерните отзиви трябва да са маркирани като „Примерен“.</p>
        <details className="card p-6"><summary className="cursor-pointer font-bold text-navy-900">+ Нов отзив</summary><div className="mt-5"><ReviewForm /></div></details>
        {reviews.map((r) => <details key={r.id} className="card p-6"><summary className="cursor-pointer font-bold text-navy-900">{r.author} <span className="font-normal text-muted">· {r.rating}★{r.isDemo ? ' · примерен' : ''}</span></summary><div className="mt-5"><ReviewForm r={r} /><form action={deleteReview.bind(null, r.id)} className="mt-4"><Button variant="danger" size="sm"><Trash2 /> Изтрий</Button></form></div></details>)}
      </section>
      <section className="space-y-4"><h2 className="text-xl">Реализирани доставки</h2>
        <details className="card p-6"><summary className="cursor-pointer font-bold text-navy-900">+ Нова доставка</summary><div className="mt-5"><DeliveryForm /></div></details>
        {deliveries.map((d) => <details key={d.id} className="card p-6"><summary className="cursor-pointer font-bold text-navy-900">{d.title} <span className="font-normal text-muted">· {d.year}{d.isDemo ? ' · примерна' : ''}</span></summary><div className="mt-5"><DeliveryForm d={d} /><form action={deleteDelivery.bind(null, d.id)} className="mt-4"><Button variant="danger" size="sm"><Trash2 /> Изтрий</Button></form></div></details>)}
      </section>
    </div>
  );
}
