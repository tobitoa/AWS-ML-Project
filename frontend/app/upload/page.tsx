'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Database, FileCheck2 } from 'lucide-react';
import { api } from '@/lib/api';
import { REQUIRED_COLUMNS, SOURCES } from '@/lib/constants';
import type { Dataset, Source } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { Toast } from '@/components/ui/toast';
import { UploadCard } from '@/components/upload/upload-card';

export default function UploadPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [busy, setBusy] = useState<Source | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [checked, setChecked] = useState(false);

  const load = useCallback(async () => {
    try {
      setDatasets(await api.datasets());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load datasets.');
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const datasetFor = (source: Source) => datasets.find(item => item.source === source);

  const upload = async (source: Source, file: File) => {
    setBusy(source);
    setError('');
    try {
      const result = await api.upload(source, file);
      await load();
      setMessage(result.valid ? `${result.filename} uploaded and validated.` : `${result.filename} uploaded; review the schema issues.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (source: Source) => {
    setError('');
    try {
      await api.deleteDataset(source);
      await load();
      setMessage('Dataset removed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not remove dataset.');
    }
  };

  const validCount = datasets.filter(item => item.valid).length;
  const allValid = SOURCES.every(source => datasetFor(source)?.valid);

  return (
    <>
      <PageHeading
        title="Upload Data"
        description="Add the three datasets required for entity resolution. Every file is schema-checked on upload."
      />

      {error ? (
        <div className="mb-4">
          <ErrorState title="Dataset request failed" message={error} onRetry={load} />
        </div>
      ) : null}

      {checked && !error && datasets.length === 0 ? (
        <div className="notice mb-4">
          <Database size={15} />
          <span>No datasets uploaded yet. Choose the three files below to begin.</span>
        </div>
      ) : null}

      <div className="source-grid">
        {SOURCES.map(source => (
          <UploadCard
            key={source}
            source={source}
            dataset={datasetFor(source)}
            busy={busy === source}
            onUpload={file => void upload(source, file)}
            onRemove={() => void remove(source)}
          />
        ))}
      </div>

      <div className="schema-footer">
        <div>
          <div className="field-label">Required columns</div>
          <div className="tag-row mt-2">
            {REQUIRED_COLUMNS.map(column => (
              <span className="tag" key={column}>
                {column}
              </span>
            ))}
          </div>
        </div>

        <div className="inline-actions">
          {checked ? <Badge tone={allValid ? 'success' : 'neutral'}>{validCount} of 3 valid</Badge> : null}
          <Link
            className="button button-primary"
            href="/run"
            aria-disabled={!allValid}
            onClick={event => {
              if (!allValid) event.preventDefault();
            }}
          >
            <FileCheck2 size={16} />
            Continue to Run
          </Link>
        </div>
      </div>

      <Toast message={message} onClose={() => setMessage('')} />
    </>
  );
}
