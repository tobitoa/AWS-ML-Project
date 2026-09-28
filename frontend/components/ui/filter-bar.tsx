import type { ReactNode } from 'react';

interface FilterBarProps {
  children: ReactNode;
  count?: ReactNode;
}

export function FilterBar({ children, count }: FilterBarProps) {
  return (
    <div className="data-toolbar">
      {children}
      {count != null ? <span className="toolbar-count">{count}</span> : null}
    </div>
  );
}
