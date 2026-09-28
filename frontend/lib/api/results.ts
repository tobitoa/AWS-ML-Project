import { apiClient } from './client';
import type { Candidate, MatchResult, PageResult } from '@/lib/types';

export interface ResultDetailResponse extends MatchResult {
  candidate_count: number;
  candidates: Candidate[];
}

export const resultsApi = {
  list: (params?: URLSearchParams) => {
    const query = params ? `?${params.toString()}` : '';
    return apiClient<PageResult<MatchResult>>(`/results${query}`);
  },

  get: (entityId: string, runId?: string) => {
    const query = runId ? `?run_id=${encodeURIComponent(runId)}` : '';
    return apiClient<ResultDetailResponse>(`/results/${encodeURIComponent(entityId)}${query}`);
  },
};
