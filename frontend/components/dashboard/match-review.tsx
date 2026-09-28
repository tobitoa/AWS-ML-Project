'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Eye, Sparkles } from 'lucide-react';

export interface MatchReviewCandidate {
  entity_id: string;
  source: 'source2' | 'source3' | string;
  business_name: string;
  business_address: string;
  country: string;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  signals: string[];
}

export interface MatchReviewItem {
  entity_id: string;
  business_name: string;
  business_address: string;
  country: string;
  confidence: number;
  matches_count: number;
  candidates: MatchReviewCandidate[];
}

interface MatchReviewProps {
  item: MatchReviewItem;
  onViewDetails: (entityId: string) => void;
}

export function MatchReview({ item, onViewDetails }: MatchReviewProps) {
  return (
    <section className="card match-review-card">
      <div className="card-header">
        <div>
          <div className="match-review-badge-row">
            <span className="match-review-tag">
              <Sparkles size={12} />
              Featured Match Review
            </span>
          </div>
          <h2 className="section-title mt-1">Cross-Source Entity Verification</h2>
          <p className="section-description">High-confidence multi-source candidate alignment</p>
        </div>
        <div className="card-header-actions">
          <Link href="/candidates" className="button button-sm button-secondary">
            View All Candidates
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="card-body">
        <div className="match-review-split">
          {/* Left: Source 1 Primary Entity */}
          <div className="match-primary-box">
            <div className="match-box-header">
              <span className="source-chip source-1">Source 1 · Anchor</span>
              <span className="mono entity-id-tag">{item.entity_id}</span>
            </div>
            <h3 className="match-entity-name">{item.business_name}</h3>
            <p className="match-entity-address">{item.business_address}</p>
            <div className="match-entity-country">
              <span className="country-dot" />
              <span>{item.country}</span>
            </div>
            <div className="match-primary-footer">
              <button
                type="button"
                className="button button-sm button-secondary"
                onClick={() => onViewDetails(item.entity_id)}
              >
                <Eye size={13} />
                View Full Dossier
              </button>
            </div>
          </div>

          {/* Right: Aligned Candidates */}
          <div className="match-candidates-container">
            <div className="candidates-header-strip">
              <span className="text-xs font-semibold">Matched Entities ({item.candidates.length})</span>
              <span className="text-2xs text-muted mono">Threshold &ge; 0.72</span>
            </div>

            <div className="candidate-cards-stack">
              {item.candidates.map(candidate => (
                <div key={candidate.entity_id} className="candidate-match-card">
                  <div className="candidate-card-top">
                    <span className={`source-chip ${candidate.source === 'source2' ? 'source-2' : 'source-3'}`}>
                      {candidate.source === 'source2' ? 'Source 2' : 'Source 3'}
                    </span>
                    <span className="mono text-2xs font-semibold">{candidate.entity_id}</span>
                    <div className="match-confidence-badge" data-level={candidate.confidence}>
                      <CheckCircle2 size={11} />
                      <span>{Math.round(candidate.similarity * 100)}% Match</span>
                    </div>
                  </div>

                  <h4 className="candidate-name">{candidate.business_name}</h4>
                  <p className="candidate-address">{candidate.business_address}</p>

                  <div className="candidate-signals">
                    {candidate.signals.map(signal => (
                      <span key={signal} className="signal-pill">
                        {signal}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
