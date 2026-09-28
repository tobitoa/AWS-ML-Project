import type { Candidate } from '@/lib/types';
import { SOURCE_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface CandidateCardProps {
  item: Candidate;
  onInspect: () => void;
}

export function CandidateCard({ item, onInspect }: CandidateCardProps) {
  const source = SOURCE_LABELS[item.candidate_source as keyof typeof SOURCE_LABELS] ?? item.candidate_source;

  return (
    <article className="record-card">
      <div className="record-card-head">
        <div>
          <h3 className="record-card-title">{item.candidate_business_name}</h3>
          <p className="mono record-card-subtitle">{item.candidate_entity_id}</p>
        </div>
        <span className="badge badge-info">{Number(item.score).toFixed(3)}</span>
      </div>
      <div className="record-card-meta">
        <span>
          {source} · for {item.source1_entity_id}
        </span>
        <span>{item.candidate_address}</span>
      </div>
      <div className="record-card-actions">
        <Button size="sm" onClick={onInspect}>
          Inspect entity
        </Button>
      </div>
    </article>
  );
}
