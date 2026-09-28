import { memo } from 'react';
import type { MatchResult } from '@/lib/types';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface ResultsTableProps {
  rows: MatchResult[];
  onView?: (entityId: string) => void;
}

export const ResultsTable = memo(function ResultsTable({ rows, onView }: ResultsTableProps) {
  return (
    <div className="table-region">
      <table className="data-table table-results">
        <thead>
          <tr>
            <th>Source 1 ID</th>
            <th>Business Name</th>
            <th>Matched Entity IDs</th>
            <th className="col-num">Confidence</th>
            <th className="col-num">Match Count</th>
            <th>Status</th>
            {onView ? <th className="col-action">View</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const confVal =
              row.confidence == null || row.confidence === ''
                ? null
                : Number(row.confidence);

            return (
              <tr
                key={row.source1_entity_id}
                onClick={() => onView && onView(row.source1_entity_id)}
                className="cursor-pointer hover:bg-surface-2"
              >
                <td className="col-id">
                  <span className="mono font-semibold text-primary">{row.source1_entity_id}</span>
                </td>
                <td>
                  <div className="table-primary font-medium">{row.business_name}</div>
                  <div className="table-secondary text-2xs text-muted">{row.business_address}, {row.country}</div>
                </td>
                <td>
                  {row.matched_entity_ids && row.matched_entity_ids.length > 0 ? (
                    <div className="matched-id-cluster">
                      {row.matched_entity_ids.slice(0, 3).map(id => (
                        <span key={id} className="matched-id-tag mono">
                          {id}
                        </span>
                      ))}
                      {row.matched_entity_ids.length > 3 && (
                        <span className="matched-id-tag mono text-muted">
                          +{row.matched_entity_ids.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted text-xs italic">None</span>
                  )}
                </td>
                <td className="col-num">
                  {confVal !== null ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="mono font-semibold">{(confVal * 100).toFixed(0)}%</span>
                      <span className="text-2xs text-muted mono">({confVal.toFixed(3)})</span>
                    </div>
                  ) : (
                    <span className="text-muted mono text-xs">—</span>
                  )}
                </td>
                <td className="col-num mono font-medium">
                  {row.matched_entity_ids.length}
                </td>
                <td>
                  <StatusIndicator status={row.status} />
                </td>
                {onView ? (
                  <td className="col-action">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        onView(row.source1_entity_id);
                      }}
                      title="View Entity Dossier"
                    >
                      <Eye size={13} />
                      View
                    </Button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

