'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Drop-in replacement for the Vaul-based Drawer using Radix Dialog + Framer Motion.
 * Exports the SAME component names to avoid refactors:
 *  - Drawer (Root), DrawerTrigger, DrawerPortal, DrawerClose,
 *    DrawerOverlay, DrawerContent, DrawerHeader, DrawerFooter,
 *    DrawerTitle, DrawerDescription
 *
 * Extras:
 * - Soporta prop opcional `side`: 'right' | 'left' | 'bottom' | 'top' (default: 'right')
 * - Mantiene data-slot y clases utilitarias.
 */

type Side = 'right' | 'left' | 'bottom' | 'top';

type DrawerRootProps = React.ComponentProps<typeof Dialog.Root> & {
  /** Dirección del drawer (para estilos) */
  side?: Side;
};

function Drawer({ side = 'right', ...props }: DrawerRootProps) {
  // Inyectamos el contexto para que DrawerContent sepa el side elegido
  return (
    <DrawerSideProvider side={side}>
      <Dialog.Root data-slot="drawer" {...props} />
    </DrawerSideProvider>
  );
}

function DrawerTrigger(props: React.ComponentProps<typeof Dialog.Trigger>) {
  return <Dialog.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof Dialog.Close>) {
  return <Dialog.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Overlay>) {
  return (
    <Dialog.Overlay
      asChild
      data-slot="drawer-overlay"
      {...props}
    >
      <motion.div
        className={cn(
          'fixed inset-0 z-50 bg-black/50',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className,
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
    </Dialog.Overlay>
  );
}

// ---- Side context to style/animate content by direction ----
const DrawerSideCtx = React.createContext<Side>('right');
function DrawerSideProvider({
  side,
  children,
}: { side: Side; children: React.ReactNode }) {
  return <DrawerSideCtx.Provider value={side}>{children}</DrawerSideCtx.Provider>;
}
function useDrawerSide() {
  return React.useContext(DrawerSideCtx);
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Dialog.Content>) {
  const side = useDrawerSide();

  // Layout classes por dirección (similar a data-[vaul-drawer-direction=*])
  const position = {
    right:
      'inset-y-0 right-0 w-3/4 sm:max-w-sm border-l',
    left:
      'inset-y-0 left-0 w-3/4 sm:max-w-sm border-r',
    bottom:
      'inset-x-0 bottom-0 max-h-[80vh] rounded-t-lg border-t mt-24',
    top:
      'inset-x-0 top-0 max-h-[80vh] rounded-b-lg border-b mb-24',
  }[side];

  // Animaciones por dirección
  const variants = {
    right: { initial: { x: 420 }, animate: { x: 0 }, exit: { x: 420 } },
    left:  { initial: { x: -420 }, animate: { x: 0 }, exit: { x: -420 } },
    bottom:{ initial: { y: 420 }, animate: { y: 0 }, exit: { y: 420 } },
    top:   { initial: { y: -420 }, animate: { y: 0 }, exit: { y: -420 } },
  }[side];

  return (
    <DrawerPortal>
      <AnimatePresence>
        <DrawerOverlay />
        <Dialog.Content asChild data-slot="drawer-content" {...props}>
          <motion.aside
            role="dialog"
            className={cn(
              'fixed z-50 flex h-auto flex-col bg-background',
              'group/drawer-content',
              position,
              className,
            )}
            {...variants}
            transition={{ type: 'tween', duration: 0.2 }}
          >
            {/* Handle superior cuando es bottom (estilo “sheet”) */}
            <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[side=bottom]/drawer-content:block" />
            {children}
          </motion.aside>
        </Dialog.Content>
      </AnimatePresence>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        'flex flex-col gap-0.5 p-4 md:gap-1.5',
        // centrado similar al de Vaul según dirección
        'text-left',
        className,
      )}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      data-slot="drawer-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof Dialog.Description>) {
  return (
    <Dialog.Description
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
