'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('RESOMESH UI Error Boundary caught an error:', error);
  }, [error]);

  return (
    <div
      className="card"
      style={{
        maxWidth: 540,
        margin: '64px auto',
        padding: '36px 28px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          padding: 12,
          borderRadius: '50%',
          background: 'var(--error-soft)',
          color: 'var(--error)',
          marginBottom: 16,
        }}
      >
        <AlertCircle size={28} />
      </div>
      <h2 className="section-title" style={{ fontSize: '18px' }}>
        Interface State Interrupted
      </h2>
      <p className="section-description" style={{ marginTop: 8, fontSize: '13px', maxWidth: '400px' }}>
        An unexpected error occurred while rendering this view. Background ML pipelines and verified datasets remain completely safe.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 }}>
        <Button variant="primary" onClick={() => reset()}>
          <RefreshCw size={14} />
          Try Again
        </Button>
        <Link className="button button-secondary" href="/">
          <Home size={14} />
          Return to Console
        </Link>
      </div>
    </div>
  );
}
