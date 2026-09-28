import type { Candidate } from '@/lib/types';
import { SOURCE_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CandidateTableProps {
  items: (Candidate & { rank?: number })[];
  onInspect: (entityId: string) => void;
}

export function CandidateTable({ items, onInspect }: CandidateTableProps) {
  return (
    <div className="table-region">
      <table className="data-table table-candidates">
        <thead>
          <tr>
            <th>Source 1</th>
            <th>Candidate</th>
            <th>Business Name</th>
            <th>Country</th>
            <th className="col-num">Confidence</th>
            <th>Rank</th>
            <th>Status</th>
            <th className="col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const scoreNum = Number(item.score);
            const isMatch = String(item.is_match).toLowerCase() === 'true' || item.is_match === true;
            const rank = item.rank ?? (idx % 3) + 1;

            return (
              <tr key={`${item.source1_entity_id}-${item.candidate_entity_id}`}>
                <td className="col-id">
                  <span className="mono font-semibold">{item.source1_entity_id}</span>
                  <div className="table-secondary">{item.source1_business_name}</div>
                </td>
                <td>
                  <div className="table-primary">
                    <span className="source-chip source-mini">
                      {SOURCE_LABELS[item.candidate_source as keyof typeof SOURCE_LABELS] ?? item.candidate_source}
                    </span>
                  </div>
                  <div className="table-secondary mono mt-1">{item.candidate_entity_id}</div>
                </td>
                <td>
                  <div className="table-primary font-medium">{item.candidate_business_name}</div>
                  <div className="table-secondary text-2xs">{item.candidate_address}</div>
                </td>
                <td>
                  <span className="text-sm">{item.candidate_country}</span>
                </td>
                <td className="col-num">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="mono font-semibold">{(scoreNum * 100).toFixed(0)}%</span>
                    <span className="text-2xs text-muted mono">({scoreNum.toFixed(3)})</span>
                  </div>
                </td>
                <td>
                  <span className="rank-chip mono">#{rank}</span>
                </td>
                <td>
                  <Badge tone={isMatch ? 'success' : 'accent'}>
                    {isMatch ? 'Matched' : 'Candidate'}
                  </Badge>
                </td>
                <td className="col-action">
                  <Button variant="ghost" size="sm" onClick={() => onInspect(item.source1_entity_id)}>
                    Inspect
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
