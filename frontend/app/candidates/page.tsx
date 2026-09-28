'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { Candidate, PageResult, Run } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/loading-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { SearchBar } from '@/components/ui/search-bar';
import { Pagination } from '@/components/ui/pagination';
import { CandidateTable } from '@/components/candidates/candidate-table';
import { CandidateCard } from '@/components/candidates/candidate-card';
import { ResultDrawer } from '@/components/results/result-drawer';

const PAGE_SIZE = 20;

export default function CandidatesPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [country, setCountry] = useState('');
  const [confidence, setConfidence] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResult<Candidate> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inspect, setInspect] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .runs()
      .then(all => {
        if (!alive) return;
        const completed = all.filter(run => run.status === 'completed');
        setRuns(completed);
        if (completed.length > 0) {
          const stored = typeof window !== 'undefined' ? (localStorage.getItem('resomesh-run-id') || localStorage.getItem('convia-run-id')) : null;
          setRunId(completed.find(run => run.run_id === stored)?.run_id || completed[0]?.run_id || '');
        } else {
          setRunId('');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!alive) return;
        setRuns([]);
        setRunId('');
        setError(err instanceof Error ? err.message : 'Unable to connect to backend service.');
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [attempt]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(async () => {
    if (!runId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      run_id: runId,
      page: String(page),
      page_size: String(PAGE_SIZE),
      search,
      source,
      country,
      status,
    });
    if (confidence) {
      params.set('confidence_min', String(Number(confidence) / 100));
    }

    try {
      const result = await api.candidates(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve candidate pairs.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [runId, page, search, source, country, confidence, status]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const clearFilters = () => {
    setQuery('');
    setSearch('');
    setSource('all');
    setCountry('');
    setConfidence('');
    setStatus('all');
    setPage(1);
  };

  return (
    <>
      <PageHeading
        title="Candidate Explorer"
        description="Inspect pairwise candidate comparisons and similarity signals generated during blocking and scoring phases."
        actions={
          runId ? (
            <a className="button button-secondary" href={api.downloadUrl(runId, 'candidates')}>
              <Download size={15} />
              Download candidate_pairs.tsv
            </a>
          ) : null
        }
      />

      {error ? (
        <ErrorState title="Unable to load candidates" message={error} onRetry={() => setAttempt(value => value + 1)} />
      ) : null}

      <div className="data-panel">
        {runs.length > 1 ? (
          <div className="toolbar-run">
            <label htmlFor="candidate-run">Active Run Execution</label>
            <select
              id="candidate-run"
              className="select"
              value={runId}
              onChange={event => {
                setRunId(event.target.value);
                setPage(1);
              }}
            >
              {runs.map(run => (
                <option key={run.run_id} value={run.run_id}>
                  {run.run_id} · {new Date(run.created_at).toLocaleDateString()} · {run.record_count ?? '—'} records
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <FilterBar count={data ? `${data.total.toLocaleString()} candidate pairs` : undefined}>
          <SearchBar
            value={query}
            onChange={setQuery}
            label="Search candidate pairs"
            placeholder="Search entity ID, candidate, or business..."
          />
          <select
            className="select"
            aria-label="Filter candidate source"
            value={source}
            onChange={event => {
              setSource(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All sources</option>
            <option value="source2">Source 2</option>
            <option value="source3">Source 3</option>
          </select>
          <input
            className="input"
            aria-label="Filter candidate country"
            placeholder="Country"
            value={country}
            onChange={event => {
              setCountry(event.target.value);
              setPage(1);
            }}
          />
          <select
            className="select"
            aria-label="Minimum confidence threshold"
            value={confidence}
            onChange={event => {
              setConfidence(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Any Confidence</option>
            <option value="50">&ge; 50%</option>
            <option value="72">&ge; 72% (Match Threshold)</option>
            <option value="85">&ge; 85%</option>
            <option value="90">&ge; 90% (High Confidence)</option>
          </select>
          <select
            className="select"
            aria-label="Filter match status"
            value={status}
            onChange={event => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Match Status</option>
            <option value="matched">Matched Only</option>
            <option value="unmatched">Non-matching Candidates</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh candidates"
            title="Refresh candidates"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </FilterBar>

        {loading ? (
          <TableSkeleton rows={8} />
        ) : !data?.total ? (
          <EmptyState
            icon={Search}
            title="No candidate pairs match your criteria"
            description="Adjust your search query, country, or confidence thresholds."
            action={<Button onClick={clearFilters}>Reset all filters</Button>}
          />
        ) : (
          <>
            <CandidateTable items={data.items} onInspect={setInspect} />
            <div className="record-card-list">
              {data.items.map(item => (
                <CandidateCard
                  key={`${item.source1_entity_id}-${item.candidate_entity_id}`}
                  item={item}
                  onInspect={() => setInspect(item.source1_entity_id)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={data.total}
              unit="candidate pairs"
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {inspect ? (
        <ResultDrawer
          entityId={inspect}
          runId={runId}
          onClose={() => setInspect('')}
        />
      ) : null}
    </>
  );
}
