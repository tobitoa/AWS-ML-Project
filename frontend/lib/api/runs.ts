import { apiClient, API_BASE_URL } from './client';
import type { Run } from '@/lib/types';

export const runsApi = {
  list: () => apiClient<Run[]>('/runs'),
  
  get: (runId: string) => apiClient<Run>(`/runs/${encodeURIComponent(runId)}`),
  
  start: () => apiClient<Run>('/runs', { method: 'POST' }),

  downloadUrl: (runId: string, kind: 'matching' | 'candidates'): string => {
    return `${API_BASE_URL}/runs/${encodeURIComponent(runId)}/download/${kind}`;
  },
};
