import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Search } from 'lucide-react';
import { OrderTimeline } from '@/components/order-timeline';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/form';
import { db } from '@/lib/db';
import { getUser, STAFF } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { normalizeVin } from '@/lib/vin';

export const metadata: Metadata = {
  title: 'Проследяване на доставка',
  description: 'Проследете автомобила си от покупката до предаването: етапи, история на събитията, очаквана дата и маршрут.',
  alternates: { canonical: '/tracking' },
  robots: { index: true },
};

export default async function Tracking({ searchParams }: { searchParams: Promise<{ order?: string; vin?: string }> }) {
  const sp = await searchParams;
  const orderNo = (sp.order ?? '').trim().toUpperCase().slice(0, 30);
  const vin = normalizeVin((sp.vin ?? '').slice(0, 20));
  const user = await getUser();
  let body: React.ReactNode = null;

  if (orderNo || vin) {
    if (!(await rateLimit('tracking', 12, 60_000))) body = <Msg>Твърде много опити. Опитайте след минута.</Msg>;
    else {
      const include = { events: { orderBy: { createdAt: 'desc' as const } } };
      // 1) Вписан собственик или служител — пълен достъп по номер на поръчка или VIN
      let order = null as Awaited<ReturnType<typeof db.order.findFirst<{ include: typeof include }>>>;
      let full = false;
      if (user) {
        order = await db.order.findFirst({ where: { OR: [orderNo ? { number: orderNo } : {}, vin ? { vin } : {}].filter((o) => Object.keys(o).length), ...(STAFF.includes(user.role) ? {} : { userId: user.id }) }, include });
        full = !!order;
      }
      // 2) Анонимен достъп: номер на поръчка + последните 6 символа на VIN
      if (!order && orderNo && vin.length >= 6) {
        const o = await db.order.findUnique({ where: { number: orderNo }, include });
        if (o && o.vin.endsWith(vin.slice(-6))) order = o;
      }
      body = order ? (
        <div className="space-y-6">
          {!full && (
            <p className="flex items-start gap-2 rounded-md bg-mist p-4 text-sm text-ink/80">
              <Lock className="mt-0.5 size-4 shrink-0 text-copper-600" />
              Показваме основна информация. За бележки, документи и пълни детайли <Link href={`/login?next=${encodeURIComponent('/tracking?order=' + order.number)}`} className="font-semibold text-copper-700 underline">влезте в профила си</Link>.
            </p>
          )}
          <OrderTimeline order={{ ...order, events: full ? order.events : order.events.filter((e) => e.isPublic).map((e) => ({ ...e, note: null })) }} showNotes={full} />
        </div>
      ) : (
        <Msg>Не намерихме поръчка с тези данни. За достъп без вход са необходими <strong>номер на поръчка</strong> и <strong>последните 6 символа на VIN</strong>.</Msg>
      );
    }
  }

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="container-x py-14">
          <p className="eyebrow">Проследяване</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Къде е моят автомобил?</h1>
          <p className="mt-3 max-w-2xl text-muted">Въведете номера на поръчката и последните 6 символа от VIN. Клиентите с профил виждат пълни детайли, бележки и документи.</p>
          <form action="/tracking" className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Номер на поръчка"><Input name="order" defaultValue={orderNo} placeholder="EAT-2026-0001" className="font-mono uppercase" /></Field>
            <Field label="VIN (поне последните 6 символа)"><Input name="vin" defaultValue={vin} placeholder="напр. 100137" className="font-mono uppercase" maxLength={20} /></Field>
            <Button type="submit" variant="copper" size="lg"><Search /> Проследи</Button>
          </form>
          {!user && <p className="mt-4 text-sm text-muted">Имате профил? <Link href="/login?next=/account/orders" className="font-semibold text-copper-700 underline">Влезте</Link>, за да видите всичките си поръчки.</p>}
        </div>
      </section>
      <div className="container-x py-10">{body ?? <p className="text-sm text-muted">Резултатите ще се покажат тук.</p>}</div>
    </>
  );
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div role="alert" className="rounded-lg border border-line bg-paper p-6 text-sm text-ink/80">{children}</div>;
}
