'use client';

import Link from 'next/link';
import { Menu, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { NAV_ITEMS } from '@/lib/constants';
import type { HealthState } from '@/lib/types';

interface TopHeaderProps {
  onMenu: () => void;
  health: HealthState;
  onOpenSearch: () => void;
}

export function TopHeader({ onMenu, health, onOpenSearch }: TopHeaderProps) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find(item => item.href === pathname);

  const getStatusDisplay = () => {
    if (health.status === 'checking') {
      return {
        tone: 'checking',
        label: 'Connecting API...',
        sublabel: 'Health probe active',
      };
    }
    if (health.status === 'offline') {
      return {
        tone: 'offline',
        label: 'API Offline',
        sublabel: 'ML Unavailable',
      };
    }
    return {
      tone: 'online',
      label: 'API Online',
      sublabel: 'ML Ready',
    };
  };

  const status = getStatusDisplay();

  return (
    <header className="top-header">
      <button type="button" className="icon-button header-menu" aria-label="Open navigation" onClick={onMenu}>
        <Menu size={18} />
      </button>

      <Link className="header-brand" href="/" aria-label="RESOMESH Home">
        <span className="brand-mark">
          <Logo size={15} />
        </span>
        <span className="brand-word">RESOMESH</span>
      </Link>

      <div className="header-context">
        <span className="header-context-root">RESOMESH</span>
        <span className="header-context-sep" aria-hidden="true">/</span>
        <span className="header-context-current">{current?.label ?? 'Console'}</span>
      </div>

      <div className="header-search-slot">
        <button type="button" className="header-search-btn" onClick={onOpenSearch} aria-label="Global search">
          <Search size={14} className="header-search-icon" />
          <span className="header-search-placeholder">Search entity, candidate, run...</span>
          <kbd className="header-search-kbd">⌘K</kbd>
        </button>
      </div>

      <div className="header-right">
        <div className="backend-status-badge" data-tone={status.tone} title={status.sublabel}>
          <span className="status-indicator-dot" />
          <div className="status-badge-text">
            <span className="status-badge-title">{status.label}</span>
          </div>
        </div>

        <ThemeToggle />

        <div className="header-profile" title="Operator Profile">
          <span className="profile-avatar">RM</span>
        </div>
      </div>
    </header>
  );
}
