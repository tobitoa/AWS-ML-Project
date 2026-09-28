'use client';

import { useEffect, useState } from 'react';
import { Check, Download, RefreshCw, X } from 'lucide-react';
import { api } from '@/lib/api';
import { SOURCE_LABELS } from '@/lib/constants';
import type { Run, Validation } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ValidationPanel } from '@/components/validation/validation-panel';

interface InputCheck {
  name: string;
  valid: boolean;
  rows: number | null;
  errors: string[];
}

export default function ValidationPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState('');
  const [validation, setValidation] = useState<Validation | null>(null);
  const [inputChecks, setInputChecks] = useState<InputCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .runs()
      .then(items => {
        if (!alive) return;
        const completed = items.filter(item => item.status === 'completed');
        setRuns(completed);
        if (completed.length > 0) {
          const stored = typeof window !== 'undefined' ? (localStorage.getItem('resomesh-run-id') || localStorage.getItem('convia-run-id')) : null;
          setRunId(completed.find(item => item.run_id === stored)?.run_id || completed[0]?.run_id || '');
        } else {
          setRunId('');
        }
      })
      .catch((err) => {
        if (!alive) return;
        setRuns([]);
        setRunId('');
        setError(err instanceof Error ? err.message : 'Unable to connect to validation service.');
      });

    return () => {
      alive = false;
    };
  }, [attempt]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');

    if (!runId) {
      api.inputValidation()
        .then(input => {
          if (!alive) return;
          setInputChecks(input.checks);
          setValidation(null);
        })
        .catch(err => {
          if (!alive) return;
          setError(err instanceof Error ? err.message : 'Input schema validation failed.');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
      return;
    }

    Promise.all([api.inputValidation(), api.validation(runId)])
      .then(([input, output]) => {
        if (!alive) return;
        setInputChecks(input.checks);
        setValidation(output);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : 'Validation data retrieval failed.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [runId, attempt]);

  const inputsValid = inputChecks.length === 3 && inputChecks.every(item => item.valid);

  return (
    <>
      <PageHeading
        title="Validation & Quality Assurance"
        description="Verify dataset schema compliance, mathematical F₀.₅ precision metrics, and 1:1 entity preservation."
        actions={
          <>
            {runs.length > 1 ? (
              <select
                className="select"
                aria-label="Completed run"
                value={runId}
                onChange={event => setRunId(event.target.value)}
              >
                {runs.map(run => (
                  <option key={run.run_id} value={run.run_id}>
                    {run.run_id} · {new Date(run.created_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            ) : null}
            <Button variant="secondary" onClick={() => setAttempt(value => value + 1)} disabled={loading}>
              <RefreshCw size={14} />
              Revalidate
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-4">
          <ErrorState
            title="Validation service status"
            message={error}
            onRetry={() => setAttempt(value => value + 1)}
          />
        </div>
      ) : null}

      <div className="split-layout">
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="section-title">Input Schemas</h2>
              <p className="section-description">
                Required columns: entity_id, business_name, business_address, country
              </p>
            </div>
            <Badge tone={inputsValid ? 'success' : 'warning'}>{inputsValid ? 'Schema Valid' : 'Check Inputs'}</Badge>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="stack-list" aria-hidden="true">
                <Skeleton className="skeleton-line" />
                <Skeleton className="skeleton-line" />
                <Skeleton className="skeleton-line" />
              </div>
            ) : (
              <div className="validation-list">
                {inputChecks.map(check => (
                  <div className="validation-row" key={check.name}>
                    <span className="validation-marker" data-valid={check.valid}>
                      {check.valid ? <Check size={12} strokeWidth={2.6} /> : <X size={12} strokeWidth={2.6} />}
                    </span>
                    <div className="validation-body">
                      <div className="validation-name font-medium">
                        {SOURCE_LABELS[check.name as keyof typeof SOURCE_LABELS] ?? check.name}
                      </div>
                      <span className="validation-detail mono text-xs">
                        {check.valid
                          ? `${(check.rows ?? 0).toLocaleString()} rows · schema verified`
                          : check.errors.join(' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {validation ? (
          <ValidationPanel
            validation={validation}
            actions={
              validation.status === 'VALID' && runId ? (
                <div className="inline-actions mt-4">
                  <a className="button button-sm button-secondary" href={api.downloadUrl(runId, 'matching')}>
                    <Download size={14} />
                    Download matching_results.tsv
                  </a>
                  <a className="button button-sm button-secondary" href={api.downloadUrl(runId, 'candidates')}>
                    <Download size={14} />
                    Download candidate_pairs.tsv
                  </a>
                </div>
              ) : null
            }
          />
        ) : null}
      </div>
    </>
  );
}
