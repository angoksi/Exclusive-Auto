import { ChevronDown } from 'lucide-react';

export function FaqList({ items }: { items: { id: string; question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-paper">
      {items.map((f) => (
        <details key={f.id} className="group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold text-navy-900">
            {f.question}
            <ChevronDown className="size-5 shrink-0 text-copper-600 transition-transform group-open:rotate-180" />
          </summary>
          <p className="prose-bg mt-3 max-w-3xl">{f.answer}</p>
        </details>
      ))}
    </div>
  );
}
