import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const Sheet        = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose   = DialogPrimitive.Close;
const SheetPortal  = DialogPrimitive.Portal;

function SheetOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

const sheetVariants = cva(
  [
    'fixed z-50 bg-background shadow-xl',
    'transition ease-in-out',
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:duration-300 data-[state=open]:duration-500',
  ],
  {
    variants: {
      side: {
        bottom: [
          'inset-x-0 bottom-0 border-t rounded-t-2xl',
          'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
          'max-h-[92dvh] flex flex-col',
        ],
        top: [
          'inset-x-0 top-0 border-b',
          'data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        ],
        left: [
          'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
          'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        ],
        right: [
          'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
          'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        ],
      },
    },
    defaultVariants: { side: 'bottom' },
  }
);

function SheetContent({ side = 'bottom', className, children, showCloseButton = true, ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground opacity-70 hover:opacity-100 hover:bg-muted transition-all focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Затвори</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col px-5 pb-3 flex-shrink-0', className)} {...props} />
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-bold text-foreground leading-none', className)}
      {...props}
    />
  );
}

function SheetDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export {
  Sheet, SheetTrigger, SheetClose, SheetPortal,
  SheetContent, SheetHeader, SheetTitle, SheetDescription,
};
