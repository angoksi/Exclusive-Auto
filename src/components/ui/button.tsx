import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-navy-900 text-white hover:bg-navy-800',
        copper: 'bg-copper-600 text-white hover:bg-copper-700',
        outline: 'border border-line bg-paper text-navy-900 hover:border-navy-900/40 hover:bg-mist',
        ghost: 'text-navy-900 hover:bg-mist',
        light: 'bg-white text-navy-900 hover:bg-cream',
        danger: 'border border-danger/30 bg-paper text-danger hover:bg-danger/5',
      },
      size: { sm: 'h-9 px-3.5', md: 'h-11 px-5', lg: 'h-12 px-7 text-[15px]', icon: 'size-10' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = 'Button';
