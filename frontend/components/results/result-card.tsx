import { memo } from 'react';
import type { MatchResult } from '@/lib/types';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';

interface ResultCardProps {
  row: MatchResult;
  onView: () => void;
}

export const ResultCard = memo(function ResultCard({ row, onView }: ResultCardProps) {
  const confidence =
    row.confidence == null || row.confidence === '' ? '—' : `${Math.round(Number(row.confidence) * 100)}%`;

  return (
    <article className="record-card">
      <div className="record-card-head">
        <div>
          <h3 className="record-card-title">{row.business_name}</h3>
          <p className="mono record-card-subtitle">{row.source1_entity_id}</p>
        </div>
        <StatusIndicator status={row.status} />
      </div>
      <div className="record-card-meta">
        <span>{row.business_address}</span>
        <span>
          {row.matched_entity_ids.length} matched · confidence {confidence}
        </span>
      </div>
      <div className="record-card-actions">
        <Button size="sm" onClick={onView}>
          View details
        </Button>
      </div>
    </article>
  );
});

