import { cn } from '@/lib/utils';

const tones = {
  neutral: 'bg-mist text-navy-900',
  navy: 'bg-navy-900 text-white',
  copper: 'bg-copper-100 text-copper-700',
  ok: 'bg-emerald-50 text-ok',
  warn: 'bg-amber-50 text-warn',
  danger: 'bg-red-50 text-danger',
  outline: 'border border-line bg-paper text-navy-900',
};

export function Badge({ tone = 'neutral', className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[11px] font-semibold', tones[tone], className)} {...p} />;
}
