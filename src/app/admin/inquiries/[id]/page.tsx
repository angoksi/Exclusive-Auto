import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionForm } from '@/components/admin/action-form';
import { Field, Input, Select, Textarea } from '@/components/ui/form';
import { db } from '@/lib/db';
import { createOffer, updateInquiry } from '@/lib/actions/admin';
import { INQUIRY_STATUS_LABEL, dateBg, eur } from '@/lib/format';
import type { CalcLine } from '@/lib/pricing';

export const metadata = { title: 'Запитване — админ' };

export default async function InquiryPage({ params }: { params: Promise<{ id: string }> }) {
  const q = await db.inquiry.findUnique({ where: { id: (await params).id }, include: { vehicle: true, offers: true, user: { select: { email: true } } } });
  if (!q) notFound();
  const payload = q.payload as { input?: unknown; result?: { lines: CalcLine[]; total: number } } & Record<string, unknown> | null;
  return (
    <div className="space-y-6">
      <Link href="/admin/inquiries" className="text-sm font-semibold text-copper-700">← Всички запитвания</Link>
      <h1 className="text-3xl">{q.name}</h1>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <div className="card p-6 text-sm">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div><dt className="text-xs text-muted">Имейл</dt><dd><a className="font-semibold text-navy-900" href={`mailto:${q.email}`}>{q.email}</a></dd></div>
              <div><dt className="text-xs text-muted">Телефон</dt><dd className="font-semibold text-navy-900">{q.phone ?? '—'}</dd></div>
              <div><dt className="text-xs text-muted">Получено</dt><dd>{dateBg(q.createdAt, true)}</dd></div>
              <div><dt className="text-xs text-muted">Съгласие (GDPR)</dt><dd>{dateBg(q.consentAt, true)}</dd></div>
              {q.vehicle && <div className="sm:col-span-2"><dt className="text-xs text-muted">Автомобил</dt><dd><Link className="font-semibold text-copper-700" href={`/admin/vehicles/${q.vehicle.id}`}>{q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</Link></dd></div>}
            </dl>
            {q.message && <p className="mt-5 whitespace-pre-wrap rounded-md bg-mist p-4 leading-6">{q.message}</p>}
          </div>
          {payload?.result && (
            <div className="card p-6"><h2 className="text-lg">Калкулация на клиента</h2>
              <dl className="mt-4 divide-y divide-line text-sm">{payload.result.lines.map((l) => <div key={l.key} className="flex justify-between py-2"><dt>{l.label}</dt><dd className="font-semibold">{eur(l.amount)}</dd></div>)}<div className="flex justify-between py-3 text-base font-extrabold"><dt>Общо</dt><dd>{eur(payload.result.total)}</dd></div></dl></div>
          )}
          {payload && !payload.result && (
            <div className="card p-6"><h2 className="text-lg">Данни от формата</h2><pre className="mt-3 overflow-x-auto rounded-md bg-mist p-4 text-xs">{JSON.stringify(payload, null, 2)}</pre></div>
          )}
          {q.offers.length > 0 && <div className="card p-6"><h2 className="text-lg">Изпратени оферти</h2><ul className="mt-3 divide-y divide-line text-sm">{q.offers.map((o) => <li key={o.id} className="flex justify-between py-2"><span>{o.title}</span><strong>{eur(o.totalEur)} · {o.status}</strong></li>)}</ul></div>}
        </div>
        <div className="space-y-6">
          <div className="card p-6"><h2 className="mb-4 text-lg">Обработка</h2>
            <ActionForm action={updateInquiry}><><input type="hidden" name="id" value={q.id} />
              <Field label="Статус"><Select name="status" defaultValue={q.status}>{(['NEW', 'IN_PROGRESS', 'QUOTED', 'CLOSED'] as const).map((s) => <option key={s} value={s}>{INQUIRY_STATUS_LABEL[s]}</option>)}</Select></Field>
              <Field label="Вътрешна бележка"><Textarea name="managerNote" defaultValue={q.managerNote ?? ''} /></Field></></ActionForm></div>
          <div className="card p-6"><h2 className="text-lg">Създай оферта</h2><p className="mb-4 mt-1 text-xs text-muted">Клиентът трябва да има регистриран профил. Получава известие.</p>
            <ActionForm action={createOffer} submit="Изпрати офертата" variant="copper"><>
              <input type="hidden" name="inquiryId" value={q.id} />
              <Field label="Имейл на клиента" name="userEmail"><Input name="userEmail" type="email" defaultValue={q.user?.email ?? q.email} required /></Field>
              <Field label="Заглавие" name="title"><Input name="title" required defaultValue={q.vehicle ? `${q.vehicle.year} ${q.vehicle.make} ${q.vehicle.model} — доставка до България` : ''} /></Field>
              <Field label="Обща сума (€)" name="totalEur"><Input name="totalEur" type="number" min={1} defaultValue={payload?.result?.total} required /></Field>
              <Field label="Валидна до"><Input name="validUntil" type="date" /></Field>
              <Field label="Бележки към клиента"><Textarea name="notes" /></Field></></ActionForm></div>
        </div>
      </div>
    </div>
  );
}
