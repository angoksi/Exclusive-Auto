import { Trash2 } from 'lucide-react';
import { ActionForm } from '@/components/admin/action-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { db } from '@/lib/db';
import { deleteBlog, saveBlog } from '@/lib/actions/admin';
import { dateBg } from '@/lib/format';

export const metadata = { title: 'Блог — админ' };
type Post = { id?: string; title?: string; excerpt?: string; body?: string; published?: boolean };

function PostForm({ p = {} }: { p?: Post }) {
  return (
    <ActionForm action={saveBlog} submit={p.id ? 'Запази' : 'Публикувай'} variant={p.id ? 'primary' : 'copper'}>
      <>
        {p.id && <input type="hidden" name="id" value={p.id} />}
        <Field label="Заглавие" name="title"><Input name="title" defaultValue={p.title} required /></Field>
        <Field label="Кратко описание" name="excerpt"><Textarea name="excerpt" defaultValue={p.excerpt} className="min-h-20" required /></Field>
        <Field label="Текст (абзаците се разделят с празен ред)" name="body"><Textarea name="body" defaultValue={p.body} className="min-h-48" required /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={p.published ?? true} className="size-4 accent-[var(--color-copper-600)]" /> Публикувана</label>
      </></ActionForm>
  );
}

export default async function AdminBlog() {
  const posts = await db.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Блог</h1>
      <details className="card p-6"><summary className="cursor-pointer text-lg font-bold text-navy-900">+ Нова публикация</summary><div className="mt-5"><PostForm /></div></details>
      {posts.map((p) => (
        <details key={p.id} className="card p-6">
          <summary className="flex cursor-pointer items-center justify-between gap-3"><span><strong className="block text-navy-900">{p.title}</strong><span className="text-xs text-muted">{dateBg(p.publishedAt ?? p.createdAt)}</span></span><Badge tone={p.published ? 'ok' : 'warn'}>{p.published ? 'Публикувана' : 'Чернова'}</Badge></summary>
          <div className="mt-5"><PostForm p={p} /><form action={deleteBlog.bind(null, p.id)} className="mt-4"><Button variant="danger" size="sm"><Trash2 /> Изтрий</Button></form></div>
        </details>
      ))}
    </div>
  );
}
