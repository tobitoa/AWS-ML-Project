'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { SOURCE_LABELS } from '@/lib/constants';
import type { Candidate, MatchResult } from '@/lib/types';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';

type Detail = MatchResult & { candidate_count: number; candidates: Candidate[] };

function isMatch(candidate: Candidate) {
  return String(candidate.is_match) === 'True' || candidate.is_match === true;
}

interface ResultDrawerProps {
  entityId: string;
  runId?: string;
  onClose: () => void;
}

export function ResultDrawer({ entityId, runId, onClose }: ResultDrawerProps) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    api
      .result(entityId, runId)
      .then(value => {
        if (active) {
          setDetail(value);
          setError('');
        }
      })
      .catch(cause => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Could not load result details.');
        }
      });
    return () => {
      active = false;
    };
  }, [entityId, runId, attempt]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="detail-backdrop"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-drawer-title"
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="drawer-header">
          <div>
            <h2 className="drawer-title" id="result-drawer-title">
              {detail?.business_name || 'Result details'}
            </h2>
            <p className="drawer-subtitle mono">{entityId}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close details" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="drawer-body">
          {error ? (
            <ErrorState title="Unable to load this record" message={error} onRetry={() => setAttempt(value => value + 1)} />
          ) : null}

          {!detail && !error ? <LoadingState label="Loading result…" /> : null}

          {detail ? (
            <>
              <section>
                <div className="drawer-section-title">
                  <span>Source record</span>
                  <StatusIndicator status={detail.status} />
                </div>
                <div className="record-block">
                  <div className="detail-fields">
                    <div className="detail-field">
                      <label>Entity ID</label>
                      <div className="mono">{detail.source1_entity_id}</div>
                    </div>
                    <div className="detail-field">
                      <label>Country</label>
                      <div>{detail.country || '—'}</div>
                    </div>
                    <div className="detail-field">
                      <label>Business name</label>
                      <div>{detail.business_name || '—'}</div>
                    </div>
                    <div className="detail-field">
                      <label>Address</label>
                      <div>{detail.business_address || '—'}</div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <div className="drawer-section-title">
                  <span>Matched records</span>
                  <span>
                    {detail.matched_entity_ids.length} matched · {detail.candidate_count} candidates
                  </span>
                </div>

                {detail.candidates.length ? (
                  <div className="stack-list">
                    {detail.candidates.map(candidate => (
                      <article
                        className="compare-card"
                        key={`${candidate.candidate_source}-${candidate.candidate_entity_id}`}
                      >
                        <div className="compare-head">
                          <span className="badge badge-info">
                            {SOURCE_LABELS[candidate.candidate_source as keyof typeof SOURCE_LABELS] ??
                              candidate.candidate_source}
                          </span>
                          <span className="compare-score">
                            {Number(candidate.score).toFixed(3)} · {isMatch(candidate) ? 'match' : 'candidate'}
                          </span>
                        </div>
                        <div className="compare-grid">
                          <div>
                            <div className="compare-col-label">Source 1</div>
                            <div className="compare-col-name">{detail.business_name}</div>
                            <div className="compare-col-detail">{detail.business_address}</div>
                            <div className="compare-col-detail mono">{detail.source1_entity_id}</div>
                          </div>
                          <div>
                            <div className="compare-col-label">Candidate</div>
                            <div className="compare-col-name">{candidate.candidate_business_name}</div>
                            <div className="compare-col-detail">{candidate.candidate_address}</div>
                            <div className="compare-col-detail mono">{candidate.candidate_entity_id}</div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="notice">No candidate records were generated for this Source 1 entity.</div>
                )}

                <p className="helper-text mt-4">
                  Candidate scores are provided by the selected resolver. No match explanation is available.
                </p>
              </section>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
