'use client';

import { Check, X } from 'lucide-react';

export type WorkflowState = 'pending' | 'active' | 'complete' | 'failed';

export interface WorkflowStep {
  label: string;
  descriptor?: string;
  state: WorkflowState;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface WorkflowProps {
  steps: WorkflowStep[];
  label: string;
  variant?: 'horizontal' | 'vertical' | 'responsive';
}

function nextConnectorState(steps: WorkflowStep[], index: number): WorkflowState | undefined {
  const current = steps[index];
  if (!current || index === steps.length - 1) return undefined;
  if (current.state === 'complete') return 'complete';
  if (current.state === 'active') return 'active';
  return undefined;
}

const STATUS_LABELS: Record<WorkflowState, string> = {
  complete: 'Completed',
  active: 'Running',
  pending: 'Pending',
  failed: 'Failed',
};

export function Workflow({ steps, label, variant = 'responsive' }: WorkflowProps) {
  return (
    <ol className={`workflow-grid workflow workflow-${variant}`} aria-label={label}>
      {steps.map((step, index) => {
        const nextState = nextConnectorState(steps, index);
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.label}
            className="workflow-step"
            data-state={step.state}
            data-next={nextState}
          >
            <div className="workflow-step-head">
              <span className="workflow-step-marker workflow-marker" aria-hidden="true">
                {step.state === 'complete' ? (
                  <Check size={13} strokeWidth={2.6} />
                ) : step.state === 'failed' ? (
                  <X size={13} strokeWidth={2.6} />
                ) : step.state === 'active' ? (
                  <span className="workflow-pulse-dot" />
                ) : (
                  <span className="workflow-step-num mono">{index + 1}</span>
                )}
              </span>
              {!isLast && (
                <div
                  className="workflow-track"
                  data-next={nextState}
                  aria-hidden="true"
                />
              )}
            </div>

            <div className="workflow-step-body">
              <span className="workflow-step-title workflow-name">{step.label}</span>
              {step.descriptor && (
                <span className="workflow-step-desc workflow-desc">{step.descriptor}</span>
              )}
              <span className="workflow-step-status" data-state={step.state}>
                {STATUS_LABELS[step.state]}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
