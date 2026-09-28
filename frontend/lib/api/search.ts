import { apiClient } from './client';
import type { SearchResponse } from '@/lib/types';

export const searchApi = {
  search: (query: string, runId?: string, limit: number = 8): Promise<SearchResponse> => {
    const params = new URLSearchParams();
    params.set('q', query);
    if (runId) {
      params.set('run_id', runId);
    }
    if (limit) {
      params.set('limit', limit.toString());
    }
    return apiClient<SearchResponse>(`/search?${params.toString()}`);
  },
};
