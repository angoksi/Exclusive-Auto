import { FileText } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { dateBg } from '@/lib/format';

export const metadata = { title: 'Документи' };

export default async function Documents() {
  const user = await requireUser('/account/documents');
  const docs = await db.document.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { order: { select: { number: true } } } });
  return (
    <div>
      <h1 className="text-3xl">Документи</h1>
      <p className="mt-2 text-sm text-muted">Документите се качват от вашия консултант — договори, фактури, митнически декларации и протоколи.</p>
      <ul className="card mt-6 divide-y divide-line">
        {docs.length === 0 && <li className="p-8 text-center text-sm text-muted">Няма качени документи.</li>}
        {docs.map((d) => <li key={d.id}><a href={`/api/documents/${d.id}`} className="flex items-center gap-3 p-4 text-sm hover:bg-mist"><FileText className="size-5 text-copper-600" /><span className="flex-1 font-semibold text-navy-900">{d.name}</span><span className="text-xs text-muted">{d.order?.number} · {dateBg(d.createdAt)}</span></a></li>)}
      </ul>
    </div>
  );
}
