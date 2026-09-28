'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'resomesh' | 'system';
export type ResolvedTheme = 'light' | 'dark' | 'resomesh';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (value: ThemePreference) => void;
  cyclePreference: () => void;
}

const STORAGE_KEY = 'resomesh-theme';
const THEME_ORDER: ThemePreference[] = ['dark', 'resomesh', 'light', 'system'];

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isPreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'resomesh' || value === 'system';
}

function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(preference: ThemePreference): ResolvedTheme {
  let theme: ResolvedTheme;
  if (preference === 'resomesh') {
    theme = 'resomesh';
  } else if (preference === 'system') {
    theme = prefersDark() ? 'dark' : 'light';
  } else {
    theme = preference;
  }
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  return theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [resolved, setResolved] = useState<ResolvedTheme>('dark');
  const hydrated = useRef(false);

  useEffect(() => {
    let active = preference;

    if (!hydrated.current) {
      hydrated.current = true;
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isPreference(stored)) {
        active = stored;
        if (stored !== preference) setPreferenceState(stored);
      }
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setResolved(applyTheme(active));
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* Storage may be unavailable; the theme still applies for this session. */
    }
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState(current => {
      const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* Ignore storage failures. */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ preference, resolved, setPreference, cyclePreference }),
    [preference, resolved, setPreference, cyclePreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
