'use client';

import { Check, Trash2 } from 'lucide-react';
import { SOURCE_DESCRIPTIONS, SOURCE_LABELS } from '@/lib/constants';
import type { Dataset, Source } from '@/lib/types';
import { formatBytes } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadZone } from './upload-zone';

interface UploadCardProps {
  source: Source;
  dataset?: Dataset;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function UploadCard({ source, dataset, busy, onUpload, onRemove }: UploadCardProps) {
  const label = SOURCE_LABELS[source];
  const status = dataset ? (dataset.valid ? 'Valid' : 'Invalid') : 'Required';
  const tone = dataset ? (dataset.valid ? 'success' : 'error') : 'neutral';

  return (
    <article className="card dataset-card">
      <div className="dataset-head">
        <div>
          <h2 className="card-title">{label}</h2>
          <p className="card-description">{SOURCE_DESCRIPTIONS[source]}</p>
        </div>
        <Badge tone={tone}>{status}</Badge>
      </div>

      <UploadZone onFile={onUpload} busy={busy} currentName={dataset?.filename} />

      <div className="dataset-meta">
        <span>
          {dataset ? (
            <>
              <span className="mono">{dataset.filename}</span>
              {' · '}
              {dataset.record_count ?? '—'} rows · {formatBytes(dataset.size_bytes)}
            </>
          ) : (
            'No dataset uploaded'
          )}
        </span>
        {dataset ? (
          <Button size="sm" variant="ghost" onClick={onRemove} aria-label={`Remove ${label} dataset`}>
            <Trash2 size={13} />
            Remove
          </Button>
        ) : null}
      </div>

      {dataset?.errors.length ? (
        <div className="dataset-feedback" data-tone="error" role="alert">
          {dataset.errors.map(error => (
            <span key={error}>{error}</span>
          ))}
        </div>
      ) : dataset?.valid ? (
        <div className="dataset-feedback" data-tone="success">
          <span className="dataset-feedback-line">
            <Check size={13} />
            Required columns are present.
          </span>
        </div>
      ) : null}
    </article>
  );
}
