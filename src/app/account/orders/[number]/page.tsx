import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import { OrderTimeline } from '@/components/order-timeline';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireUser(`/account/orders/${number}`);
  const order = await db.order.findFirst({ where: { number, userId: user.id }, include: { events: { orderBy: { createdAt: 'desc' } }, documents: true } });
  if (!order) notFound();
  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="text-sm font-semibold text-copper-700">← Всички поръчки</Link>
      <OrderTimeline order={order} showNotes />
      {order.documents.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg">Документи по поръчката</h2>
          <ul className="mt-4 divide-y divide-line">{order.documents.map((d) => <li key={d.id}><a href={`/api/documents/${d.id}`} className="flex items-center gap-3 py-3 text-sm font-semibold text-navy-900 hover:text-copper-700"><FileText className="size-4 text-copper-600" />{d.name}</a></li>)}</ul>
        </div>
      )}
    </div>
  );
}
