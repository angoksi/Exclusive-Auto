import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { setUserRole } from '@/lib/actions/admin';
import { ROLE_LABEL, dateBg } from '@/lib/format';

export const metadata = { title: 'Потребители — админ' };

export default async function AdminUsers() {
  const me = await requireRole(['ADMIN']);
  const users = await db.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { orders: true, inquiries: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Потребители <span className="text-lg text-muted">({users.length})</span></h1>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wider text-muted"><tr><th className="p-3">Потребител</th><th className="p-3">Регистрация</th><th className="p-3">Поръчки / запитв.</th><th className="p-3">Роля</th></tr></thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-3"><strong className="block text-navy-900">{u.name}</strong><span className="text-xs text-muted">{u.email}</span></td>
                <td className="p-3">{dateBg(u.createdAt)}</td><td className="p-3">{u._count.orders} / {u._count.inquiries}</td>
                <td className="p-3">{u.id === me.id ? <Badge tone="navy">{ROLE_LABEL[u.role]} (вие)</Badge> : (
                  <div className="flex gap-1.5">{(['CUSTOMER', 'MANAGER', 'ADMIN'] as const).map((r) => <form key={r} action={setUserRole.bind(null, u.id, r)}><Button size="sm" variant={u.role === r ? 'primary' : 'outline'} disabled={u.role === r}>{ROLE_LABEL[r]}</Button></form>)}</div>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
