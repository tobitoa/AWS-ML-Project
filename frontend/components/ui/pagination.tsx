import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  unit: string;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageCount, total, unit, onPageChange }: PaginationProps) {
  return (
    <div className="pagination">
      <span>
        Page {page} of {pageCount} · {total.toLocaleString()} {unit}
      </span>
      <div className="pagination-controls">
        <Button size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} />
          Previous
        </Button>
        <Button size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
