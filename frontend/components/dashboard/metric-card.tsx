import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: number | string | null | undefined;
  note: string;
  icon: LucideIcon;
  tone?: 'blue' | 'pink' | 'green' | 'lavender' | 'peach';
}

export function MetricCard({ label, value, note, icon: Icon, tone }: MetricCardProps) {
  const displayValue =
    value == null
      ? '—'
      : typeof value === 'number'
        ? value.toLocaleString()
        : value;

  return (
    <article className={`card metric-card ${tone ? `metric-card-${tone}` : ''}`}>
      <div className="metric-label">
        <span>{label}</span>
        <Icon size={15} strokeWidth={1.7} />
      </div>
      <div className="metric-value">{displayValue}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}
