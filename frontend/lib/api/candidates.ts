import { apiClient } from './client';
import type { Candidate, PageResult } from '@/lib/types';

export const candidatesApi = {
  list: (params?: URLSearchParams) => {
    const query = params ? `?${params.toString()}` : '';
    return apiClient<PageResult<Candidate>>(`/candidates${query}`);
  },

  forEntity: (entityId: string, runId?: string) => {
    const query = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
    return apiClient<Candidate[]>(`/candidates/${encodeURIComponent(entityId)}${query}`);
  },
};
