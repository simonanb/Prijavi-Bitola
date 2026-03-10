import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'text-foreground',
        submitted:   'border-amber-300  bg-amber-100  text-amber-800',
        in_review:   'border-blue-300   bg-blue-100   text-blue-800',
        resolved:    'border-green-300  bg-green-100  text-green-800',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({ className, variant, dot, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-amber-400': variant === 'submitted',
        'bg-blue-400':  variant === 'in_review',
        'bg-green-400': variant === 'resolved',
      })} />}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
