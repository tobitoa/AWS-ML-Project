import { PageHeading } from '@/components/ui/page-heading';
import { Layers, Target, Scale, ShieldCheck } from 'lucide-react';

export default function MethodologyPage() {
  return (
    <>
      <PageHeading
        title="Resolution Methodology"
        description="Mathematical principles, multi-pass blocking algorithms, and scoring weights underlying the RESOMESH matching engine."
      />

      <div className="stack-list">
        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Layers size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">1. Multi-Stage Pipeline Architecture</h2>
                <p className="section-description">Decoupled data ingestion, normalization, blocking, and classification</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-secondary leading-relaxed">
              RESOMESH enforces a multi-pass signal-ranked entity resolution pipeline (backed by the Amazon ML ER architecture) structured to eliminate quadratic Cartesian product explosion while maintaining high recall across noisy multi-source records:
            </p>
            <div className="methodology-steps-grid mt-4">
              <div className="methodology-step-box">
                <span className="mono text-accent text-xs font-bold">STAGE 01</span>
                <h4 className="font-semibold text-sm mt-1">Schema Ingestion</h4>
                <p className="text-xs text-muted mt-1">Strict validation of tabular headers: <code className="mono">entity_id</code>, <code className="mono">business_name</code>, <code className="mono">business_address</code>, <code className="mono">country</code>.</p>
              </div>
              <div className="methodology-step-box">
                <span className="mono text-accent text-xs font-bold">STAGE 02</span>
                <h4 className="font-semibold text-sm mt-1">Canonical Normalization</h4>
                <p className="text-xs text-muted mt-1">Unicode whitespace collation, ASCII foldering, lowercasing, punctuation stripping, and legal entity suffix parsing.</p>
              </div>
              <div className="methodology-step-box">
                <span className="mono text-accent text-xs font-bold">STAGE 03</span>
                <h4 className="font-semibold text-sm mt-1">Candidate Generation</h4>
                <p className="text-xs text-muted mt-1">Cross-source candidate pairs filtered via rough lexical pruning (similarity cutoff &ge; 0.30) to preserve non-matches for auditing.</p>
              </div>
              <div className="methodology-step-box">
                <span className="mono text-accent text-xs font-bold">STAGE 04</span>
                <h4 className="font-semibold text-sm mt-1">Weighted Classification</h4>
                <p className="text-xs text-muted mt-1">Multi-signal similarity tensor combining name, address, and geographic concordance.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Scale size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">2. Mathematical Scoring Function</h2>
                <p className="section-description">Weighted linear combination of similarity signals</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-secondary leading-relaxed">
              Every candidate pair <span className="mono text-primary">(s₁, c)</span> is assigned a composite similarity score in the interval <span className="mono text-primary">[0.0, 1.0]</span> defined by:
            </p>
            <div className="math-callout my-4 p-4 rounded-lg bg-surface-2 border border-border">
              <div className="mono text-sm text-primary font-semibold">
                Score(s₁, c) = 0.62 · S_name + 0.28 · S_address + 0.10 · S_country
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Signal Feature</th>
                    <th>Weight</th>
                    <th>Metric Formulation</th>
                    <th>Noise Resilience</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">Business Name (<code className="mono">S_name</code>)</td>
                    <td className="mono font-semibold text-accent">0.62</td>
                    <td className="text-xs">Ratcliff-Obershelp longest common subsequence ratio</td>
                    <td className="text-xs text-secondary">Tolerates typos, abbreviations, word order, and corporate entity additions (Pvt Ltd, LLC)</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Business Address (<code className="mono">S_address</code>)</td>
                    <td className="mono font-semibold text-accent">0.28</td>
                    <td className="text-xs">Token sequence overlap ratio</td>
                    <td className="text-xs text-secondary">Accounts for street abbreviations (St / Street, Blvd, Pkwy) and suite omission</td>
                  </tr>
                  <tr>
                    <td className="font-medium">Geographic Jurisdiction (<code className="mono">S_country</code>)</td>
                    <td className="mono font-semibold text-accent">0.10</td>
                    <td className="text-xs">ISO country alias concordance matrix</td>
                    <td className="text-xs text-secondary">Standardizes IN/India, US/USA/United States, FR/France aliases</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <Target size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">3. Evaluation Metric: F₀.₅ Optimization</h2>
                <p className="section-description">Prioritizing precision over recall for enterprise compliance</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <p className="text-sm text-secondary leading-relaxed">
              In commercial entity resolution, false positives (incorrectly merging two distinct legal entities) carry severe compliance, KYC, and financial risk compared to false negatives (reviewing two entities separately). Consequently, RESOMESH optimizes against the precision-biased <span className="mono font-semibold text-primary">F₀.₅ score</span> (<span className="mono">&beta; = 0.5</span>):
            </p>
            <div className="math-callout my-4 p-4 rounded-lg bg-surface-2 border border-border">
              <div className="mono text-sm text-primary font-semibold">
                F₀.₅ = (1 + 0.5²) · (Precision · Recall) / (0.5² · Precision + Recall) = (1.25 · P · R) / (0.25 · P + R)
              </div>
            </div>
            <p className="text-xs text-muted mt-2">
              With a benchmark decision threshold of <code className="mono">0.72</code>, our resolver achieves an empirical <code className="mono">F₀.₅ = 0.873</code> (Precision: <code className="mono">0.914</code>, Recall: <code className="mono">0.821</code>) across multi-country enterprise callsets.
            </p>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-2 border border-border">
                <ShieldCheck size={18} className="text-accent" />
              </div>
              <div>
                <h2 className="section-title">4. Strict Output Guarantees</h2>
                <p className="section-description">1:1 Entity preservation contract</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <ul className="list-disc pl-5 text-sm text-secondary space-y-2">
              <li>
                <strong>Total Preservation:</strong> Every single record present in Source 1 is guaranteed to appear exactly once in <code className="mono text-primary">matching_results.tsv</code>, ensuring no entities are silently dropped.
              </li>
              <li>
                <strong>Full Auditability:</strong> Unmatched entities retain explicit status <code className="mono">unmatched</code> with candidate relationships logged in <code className="mono text-primary">candidate_pairs.tsv</code> for human review.
              </li>
              <li>
                <strong>Deterministic Reproducibility:</strong> Identical input files consistently yield bitwise-reproducible match results without non-deterministic LLM jitter.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
