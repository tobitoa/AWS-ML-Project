'use client';

import { AlertTriangle } from 'lucide-react';
import type { HealthState } from '@/lib/types';

export function StatusBanner({ health }: { health: HealthState }) {
  if (health.status === 'checking') {
    return (
      <div className="status-banner" data-tone="checking">
        <span className="spinner spinner-sm" aria-hidden="true" />
        <span>Connecting to the RESOMESH backend API…</span>
      </div>
    );
  }

  if (health.status === 'offline') {
    return (
      <div className="status-banner" data-tone="warning" role="status">
        <AlertTriangle size={14} className="status-banner-icon" />
        <span>
          <strong>Backend Offline.</strong> The aws-main-ml service is unreachable. Start the backend service (<code className="mono">uvicorn backend.app.main:app --reload</code>) to execute jobs and view results.
        </span>
      </div>
    );
  }

  return null;
}
