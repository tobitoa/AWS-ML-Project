'use client';

import { Monitor, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme, type ThemePreference } from './theme-provider';

const NEXT_LABEL: Record<ThemePreference, string> = {
  dark: 'RESOMESH-Theme',
  resomesh: 'Light',
  light: 'System',
  system: 'Dark',
};

const ICONS: Record<ThemePreference, typeof Sun> = {
  light: Sun,
  dark: Moon,
  resomesh: Sparkles,
  system: Monitor,
};

export function ThemeToggle() {
  const { preference, resolved, cyclePreference } = useTheme();
  const Icon = ICONS[preference];
  const title =
    preference === 'system'
      ? `Theme: System (${resolved}) — click for ${NEXT_LABEL[preference]}`
      : `Theme: ${preference === 'resomesh' ? 'RESOMESH-Theme' : preference} — click for ${NEXT_LABEL[preference]}`;

  return (
    <button type="button" className="icon-button icon-button-bordered" onClick={cyclePreference} aria-label={title} title={title}>
      <Icon size={16} strokeWidth={1.8} />
    </button>
  );
}
