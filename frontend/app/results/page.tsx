'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, RefreshCw, Search } from 'lucide-react';
import { api } from '@/lib/api';
import type { MatchResult, PageResult, Run } from '@/lib/types';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { TableSkeleton } from '@/components/ui/loading-state';
import { FilterBar } from '@/components/ui/filter-bar';
import { SearchBar } from '@/components/ui/search-bar';
import { Pagination } from '@/components/ui/pagination';
import { ResultsTable } from '@/components/results/results-table';
import { ResultCard } from '@/components/results/result-card';
import { ResultDrawer } from '@/components/results/result-drawer';

export default function ResultsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [country, setCountry] = useState('');
  const [confidence, setConfidence] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<PageResult<MatchResult> | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ processed: 0, matched: 0, unmatched: 0 });
  const [attempt, setAttempt] = useState(0);

  const handleView = useCallback((id: string) => {
    setSelected(id);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('resomesh_page_size');
      if (saved && ['25', '50', '100'].includes(saved)) {
        setPageSize(Number(saved));
      }
    }
  }, []);

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
          const activeRun = completed.find(run => run.run_id === stored) || completed[0];
          setRunId(activeRun.run_id);
          setStats({
            processed: activeRun.record_count ?? activeRun.records_processed ?? 0,
            matched: activeRun.matched_count ?? 0,
            unmatched: activeRun.unmatched_count ?? 0,
          });
        } else {
          setRunId('');
          setStats({ processed: 0, matched: 0, unmatched: 0 });
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
      page_size: String(pageSize),
      search,
      status,
      source,
    });
    if (country) params.set('country', country);
    if (confidence) params.set('confidence_min', String(Number(confidence) / 100));

    try {
      const result = await api.results(params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrieve match results.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [runId, page, pageSize, search, status, source, country, confidence]);

  useEffect(() => {
    void load();
  }, [load, attempt]);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  const clearFilters = () => {
    setQuery('');
    setSearch('');
    setStatus('all');
    setSource('all');
    setCountry('');
    setConfidence('');
    setPage(1);
  };

  return (
    <>
      <PageHeading
        title="Matching Results"
        description="Inspect resolved entities, cross-source candidate links, and confidence distributions from model executions."
        actions={
          runId ? (
            <a className="button button-secondary" href={api.downloadUrl(runId, 'matching')}>
              <Download size={15} />
              Download matching_results.tsv
            </a>
          ) : null
        }
      />

      {error ? (
        <ErrorState title="Unable to load results" message={error} onRetry={() => setAttempt(value => value + 1)} />
      ) : null}

      {/* Results Overview Metrics Bar */}
      <div className="results-metrics-strip mb-6">
        <div className="result-metric-item">
          <span className="result-metric-label">Entities Processed</span>
          <span className="result-metric-value mono">{stats.processed.toLocaleString()}</span>
        </div>
        <div className="result-metric-sep" />
        <div className="result-metric-item">
          <span className="result-metric-label">Confirmed Matches</span>
          <span className="result-metric-value text-success mono">{stats.matched.toLocaleString()}</span>
        </div>
        <div className="result-metric-sep" />
        <div className="result-metric-item">
          <span className="result-metric-label">Unmatched Entities</span>
          <span className="result-metric-value text-muted mono">{stats.unmatched.toLocaleString()}</span>
        </div>
        <div className="result-metric-sep" />
        <div className="result-metric-item">
          <span className="result-metric-label">Preservation Coverage</span>
          <span className="result-metric-value text-accent mono">
            {stats.processed > 0 ? `${(((stats.matched + stats.unmatched) / stats.processed) * 100).toFixed(1)}%` : '—'}
          </span>
        </div>
      </div>

      <div className="data-panel">
        {runs.length > 1 ? (
          <div className="toolbar-run">
            <label htmlFor="results-run">Active Run Execution</label>
            <select
              id="results-run"
              className="select"
              value={runId}
              onChange={event => {
                const nextId = event.target.value;
                setRunId(nextId);
                const match = runs.find(r => r.run_id === nextId);
                if (match) {
                  setStats({
                    processed: match.record_count ?? match.records_processed ?? 0,
                    matched: match.matched_count ?? 0,
                    unmatched: match.unmatched_count ?? 0,
                  });
                }
                setPage(1);
              }}
            >
              {runs.map(run => (
                <option value={run.run_id} key={run.run_id}>
                  {run.run_id} · {new Date(run.created_at).toLocaleDateString()} · {run.record_count ?? '—'} records
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <FilterBar count={data ? `${data.total.toLocaleString()} entities` : undefined}>
          <SearchBar
            value={query}
            onChange={setQuery}
            label="Search results"
            placeholder="Search entity ID, business name, or address..."
          />
          <select
            className="select"
            aria-label="Filter by status"
            value={status}
            onChange={event => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">All statuses</option>
            <option value="matched">Matched</option>
            <option value="unmatched">Unmatched</option>
          </select>
          <select
            className="select"
            aria-label="Filter by source"
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
            value={country}
            onChange={event => {
              setCountry(event.target.value);
              setPage(1);
            }}
            placeholder="Country"
            aria-label="Filter by country"
          />
          <select
            className="select"
            aria-label="Minimum confidence"
            value={confidence}
            onChange={event => {
              setConfidence(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Any confidence</option>
            <option value="50">&ge; 50%</option>
            <option value="72">&ge; 72% (Decision Boundary)</option>
            <option value="85">&ge; 85%</option>
            <option value="90">&ge; 90% (High Confidence)</option>
          </select>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
            aria-label="Refresh results"
            title="Refresh results"
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
            title="No entity results match your query"
            description="Try relaxing your filters or search keywords."
            action={<Button onClick={clearFilters}>Reset all filters</Button>}
          />
        ) : (
          <>
            <ResultsTable rows={data.items} onView={handleView} />
            <div className="record-card-list">
              {data.items.map(row => (
                <ResultCard
                  key={row.source1_entity_id}
                  row={row}
                  onView={() => handleView(row.source1_entity_id)}
                />
              ))}
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={data.total}
              unit="entities"
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {selected ? (
        <ResultDrawer
          entityId={selected}
          runId={runId}
          onClose={() => setSelected('')}
        />
      ) : null}
    </>
  );
}
