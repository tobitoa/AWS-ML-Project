import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={18} strokeWidth={1.7} />
      </span>
      <span className="empty-title">{title}</span>
      <p className="empty-description">{description}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
