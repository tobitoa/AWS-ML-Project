'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { NAV_ITEMS } from '@/lib/constants';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="sidebar" data-open={open} aria-label="Primary navigation">
      <div className="sidebar-header">
        <Link className="sidebar-brand" href="/" onClick={onClose}>
          <span className="brand-mark">
            <Logo size={18} />
          </span>
          <span className="brand-word">RESOMESH</span>
        </Link>
        <button
          type="button"
          className="icon-button sidebar-close"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>
      </div>

      <div className="sidebar-body">
        <div className="sidebar-section-title">Navigation</div>
        <nav className="nav-list">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                className="nav-link"
                href={href}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
              >
                <Icon size={16} strokeWidth={1.8} className="nav-icon" />
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="sidebar-footer-row">
            <div className="sidebar-footer-dot" aria-hidden="true" />
            <span className="sidebar-footer-title">aws-main-ml Engine</span>
          </div>
          <p className="sidebar-footer-desc">
            Local storage · backend/storage
          </p>
        </div>
      </div>
    </aside>
  );
}
