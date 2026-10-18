import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('size-9', className)} aria-hidden>
      <rect width="48" height="48" rx="10" fill="currentColor" />
      <g fill="#c98a5b">
        <path d="M15 35 21 12h4.5L19.5 35z" />
        <path d="M21 12h19l-1.6 4.6H22.8z" />
        <path d="M19.4 21.6h16.4l-1.4 4.2H18.2z" />
      </g>
      <path d="M8 36.5c6-4.6 17-6.2 27-3l5 3" fill="none" stroke="#f3e4d6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <LogoMark className={light ? 'text-white/10' : 'text-navy-900'} />
      <span className="flex flex-col leading-none">
        <span className={cn('text-[17px] font-extrabold tracking-[0.14em]', light ? 'text-white' : 'text-navy-900')}>EXCLUSIVE</span>
        <span className={cn('mt-1 text-[9.5px] font-semibold tracking-[0.42em]', light ? 'text-copper-300' : 'text-copper-600')}>AUTO TRADE</span>
      </span>
    </span>
  );
}
