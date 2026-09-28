import { Skeleton } from './skeleton';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton className="skeleton-line-sm" />
      <Skeleton className="skeleton-value" />
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton className="skeleton-line" key={index} />
      ))}
    </div>
  );
}

export function MetricSkeleton() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton className="skeleton-line-sm" />
      <Skeleton className="skeleton-value" />
      <Skeleton className="skeleton-line-sm" />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </div>
  );
}

export function ContextualLoadingState({
  title = 'Processing Engine',
  message = 'Analyzing records and evaluating candidate pairs…',
  stage,
}: {
  title?: string;
  message?: string;
  stage?: string;
}) {
  return (
    <div className="card text-center p-8 flex flex-col items-center justify-center gap-3">
      <span className="spinner" aria-hidden="true" />
      {stage && <span className="badge badge-accent mono text-2xs">{stage}</span>}
      <h3 className="font-semibold text-sm text-primary">{title}</h3>
      <p className="text-xs text-secondary max-w-sm">{message}</p>
    </div>
  );
}
