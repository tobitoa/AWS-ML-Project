import type { ReactNode } from 'react';
import { CheckCircle2, CircleX, AlertTriangle } from 'lucide-react';
import type { Validation } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const FRIENDLY_NAMES: Record<string, string> = {
  'matching_results.tsv schema': 'Matching output TSV schema & headers',
  'candidate_pairs.tsv schema': 'Candidate pairs TSV schema & headers',
  'matching_results.tsv': 'Matching output TSV schema & headers',
  'candidate_pairs.tsv': 'Candidate pairs TSV schema & headers',
  'Source 1 record coverage': 'Source 1 complete record preservation (1:1)',
};

function displayName(name: string) {
  if (FRIENDLY_NAMES[name]) return FRIENDLY_NAMES[name];
  const source = /^source(\d)( input)?$/i.exec(name);
  if (source) return `Source ${source[1]} input integrity`;
  return name;
}

function detail(check: Validation['checks'][number]) {
  if (!check.valid) return (check.errors || ['Validation failed.']).join(' ');
  if (check.rows != null) return `${check.rows.toLocaleString()} rows validated · passed`;
  return 'Passed';
}

interface ValidationPanelProps {
  validation: Validation;
  actions?: ReactNode;
}

export function ValidationPanel({ validation, actions }: ValidationPanelProps) {
  const passed = validation.status === 'VALID';
  const f05 = typeof validation.f05 === 'number' ? validation.f05.toFixed(3) : '—';
  const precision = typeof validation.precision === 'number' ? validation.precision.toFixed(3) : '—';
  const recall = typeof validation.recall === 'number' ? validation.recall.toFixed(3) : '—';
  const coverage = validation.coverage ? `${Math.round(validation.coverage * 100)}%` : '100%';
  const rowsValidated = validation.rows_validated != null ? validation.rows_validated.toLocaleString() : '—';
  const errorCount = validation.errors.length;
  const warningCount = validation.warnings?.length ?? 0;

  return (
    <section className="card">
      <div className="card-header">
        <div>
          <h2 className="section-title">Model & Schema Validation</h2>
          <p className="section-description">Verification of statistical precision, schema compliance, and record preservation</p>
        </div>
        <Badge tone={passed ? 'success' : 'error'}>{passed ? 'PASSED' : 'FAILED'}</Badge>
      </div>

      <div className="card-body stack-list">
        {/* Validation Telemetry Strip */}
        <div className="val-metrics-grid">
          <div className="val-metric-box">
            <span className="val-metric-label">Validation</span>
            <span className={`val-metric-val font-bold ${passed ? 'text-success' : 'text-error'}`}>
              {passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">F₀.₅ Score</span>
            <span className="val-metric-val mono text-primary">{f05}</span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">Precision</span>
            <span className="val-metric-val mono text-primary">{precision}</span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">Recall</span>
            <span className="val-metric-val mono text-primary">{recall}</span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">Coverage</span>
            <span className="val-metric-val mono text-primary">{coverage}</span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">Rows Validated</span>
            <span className="val-metric-val mono text-primary">{rowsValidated}</span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">Errors</span>
            <span className={`val-metric-val mono ${errorCount === 0 ? 'text-success' : 'text-error'}`}>
              {errorCount}
            </span>
          </div>
          <div className="val-metric-box">
            <span className="val-metric-label">Warnings</span>
            <span className={`val-metric-val mono ${warningCount === 0 ? 'text-muted' : 'text-warning'}`}>
              {warningCount}
            </span>
          </div>
        </div>

        {/* Warning messages */}
        {validation.warnings && validation.warnings.length > 0 && (
          <div className="val-alert-box val-alert-warning">
            <div className="val-alert-head">
              <AlertTriangle size={15} className="text-warning flex-none" />
              <span className="text-xs font-semibold">Validation Warnings ({validation.warnings.length})</span>
            </div>
            <ul className="val-alert-list">
              {validation.warnings.map((w, idx) => (
                <li key={idx} className="text-xs text-secondary">{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Errors list */}
        {errorCount > 0 && (
          <div className="val-alert-box val-alert-error">
            <div className="val-alert-head">
              <CircleX size={15} className="text-error flex-none" />
              <span className="text-xs font-semibold">Blocking Issues ({errorCount})</span>
            </div>
            <ul className="val-alert-list">
              {validation.errors.map((e, idx) => (
                <li key={idx} className="text-xs text-error font-medium">{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Check List */}
        <div className="val-checks-container">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Automated Checks</span>
          <div className="table-responsive mt-2">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Verification Rule</th>
                  <th style={{ width: '15%' }}>Result</th>
                  <th style={{ width: '45%' }}>Diagnostic Detail</th>
                </tr>
              </thead>
              <tbody>
                {validation.checks.map(check => (
                  <tr key={check.name}>
                    <td className="font-medium text-xs">{displayName(check.name)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {check.valid ? (
                          <>
                            <CheckCircle2 size={13} className="text-success" />
                            <span className="text-2xs font-semibold text-success uppercase">Passed</span>
                          </>
                        ) : (
                          <>
                            <CircleX size={13} className="text-error" />
                            <span className="text-2xs font-semibold text-error uppercase">Failed</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="text-xs text-muted mono">{detail(check)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {actions && <div className="mt-4">{actions}</div>}
      </div>
    </section>
  );
}
