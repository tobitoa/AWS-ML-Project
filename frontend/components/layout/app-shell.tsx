'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import type { HealthState } from '@/lib/types';
import { Sidebar } from './sidebar';
import { StatusBanner } from './status-banner';
import { TopHeader } from './top-header';
import { CommandSearch } from '@/components/search/command-search';
import { DropletLayer } from '@/components/theme/droplet-layer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [health, setHealth] = useState<HealthState>({ status: 'checking' });
  const pathname = usePathname();

  useEffect(() => {
    let alive = true;
    api
      .health()
      .then(data => {
        if (!alive) return;
        setHealth({
          status: 'online',
          modelName: data.model_name,
          modelMode: data.model_mode,
          mlReady: true,
        });
      })
      .catch(() => {
        if (!alive) return;
        setHealth({ status: 'offline' });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      <DropletLayer />
      <button
        type="button"
        className="nav-scrim"
        data-open={navOpen}
        disabled={!navOpen}
        onClick={() => setNavOpen(false)}
        aria-label="Close navigation"
      />
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-main">
        <TopHeader
          onMenu={() => setNavOpen(true)}
          health={health}
          onOpenSearch={() => setSearchOpen(true)}
        />
        <StatusBanner health={health} />
        <main className="content">{children}</main>
        <footer className="app-footer">
          <span>RESOMESH · Enterprise Entity Resolution Console</span>
          <span>Powered by aws-main-ml</span>
          <span>Local processing · data stays on this server</span>
        </footer>
      </div>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
