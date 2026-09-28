'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { DropletLayer } from './droplet-layer';

export function ResomeshTheme({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DropletLayer />
      {children}
    </ThemeProvider>
  );
}

export { DropletLayer } from './droplet-layer';
export { ThemeProvider, useTheme } from './theme-provider';
export { ThemeToggle } from './theme-toggle';
