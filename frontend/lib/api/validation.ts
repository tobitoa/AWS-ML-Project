import { apiClient } from './client';
import type { Validation } from '@/lib/types';

export const validationApi = {
  validateRun: (runId: string) => {
    return apiClient<Validation>(`/validation/${encodeURIComponent(runId)}`, {
      method: 'POST',
    });
  },

  getValidation: (runId: string) => {
    return apiClient<Validation>(`/validation/${encodeURIComponent(runId)}`);
  },
};
