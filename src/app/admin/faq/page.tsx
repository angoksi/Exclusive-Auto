import { Trash2 } from 'lucide-react';
import { ActionForm } from '@/components/admin/action-form';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/form';
import { db } from '@/lib/db';
import { deleteFaq, saveFaq } from '@/lib/actions/admin';

export const metadata = { title: 'FAQ — админ' };
type F = { id?: string; question?: string; answer?: string; position?: number };

function FaqForm({ f = {} }: { f?: F }) {
  return (
    <ActionForm action={saveFaq} submit={f.id ? 'Запази' : 'Добави'} variant={f.id ? 'primary' : 'copper'}>
      <>
        {f.id && <input type="hidden" name="id" value={f.id} />}
        <Field label="Въпрос" name="question"><Input name="question" defaultValue={f.question} required /></Field>
        <Field label="Отговор" name="answer"><Textarea name="answer" defaultValue={f.answer} required /></Field>
        <Field label="Позиция (по-малко = по-горе)"><Input name="position" type="number" min={0} defaultValue={f.position ?? 0} className="w-32" /></Field>
      </></ActionForm>
  );
}

export default async function AdminFaq() {
  const items = await db.faq.findMany({ orderBy: { position: 'asc' } });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl">Често задавани въпроси</h1>
      <details className="card p-6"><summary className="cursor-pointer text-lg font-bold text-navy-900">+ Нов въпрос</summary><div className="mt-5"><FaqForm f={{ position: items.length }} /></div></details>
      {items.map((f) => (
        <details key={f.id} className="card p-6"><summary className="cursor-pointer font-bold text-navy-900">{f.question}</summary><div className="mt-5"><FaqForm f={f} /><form action={deleteFaq.bind(null, f.id)} className="mt-4"><Button variant="danger" size="sm"><Trash2 /> Изтрий</Button></form></div></details>
      ))}
    </div>
  );
}
