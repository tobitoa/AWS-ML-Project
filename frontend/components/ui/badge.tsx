import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'accent';

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={cn('badge', `badge-${tone}`)}>{children}</span>;
}
