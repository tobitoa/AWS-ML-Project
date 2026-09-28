import type { ReactNode } from 'react';
import { CircleAlert, RotateCcw } from 'lucide-react';
import { Button } from './button';

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorState({ title, message, onRetry, action }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <CircleAlert size={17} className="error-state-icon" />
      <div className="error-state-body">
        <span className="error-state-title">{title}</span>
        <span className="error-state-message">{message}</span>
        {onRetry || action ? (
          <div className="error-state-action inline-actions">
            {onRetry ? (
              <Button size="sm" onClick={onRetry}>
                <RotateCcw size={13} />
                Retry
              </Button>
            ) : null}
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
