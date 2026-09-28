'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export function Toast({ message, error, onClose }: { message: string; error?: boolean; onClose: () => void }) {
  useEffect(() => { if (message) { const id = window.setTimeout(onClose, 3400); return () => window.clearTimeout(id); } }, [message, onClose]);
  return <div className={cn('toast', message && 'toast-visible', error && 'toast-error')} role="status" aria-live="polite">{message}</div>;
}
