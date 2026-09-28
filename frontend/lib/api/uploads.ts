import { apiClient } from './client';
import type { Dataset, Source } from '@/lib/types';

export interface DatasetValidationCheck {
  name: string;
  valid: boolean;
  rows: number | null;
  errors: string[];
}

export interface InputValidationResponse {
  status: 'VALID' | 'FAILED';
  checks: DatasetValidationCheck[];
}

export const uploadsApi = {
  list: () => apiClient<Dataset[]>('/datasets'),
  
  upload: (source: Source, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient<Dataset>(`/datasets/upload?source=${encodeURIComponent(source)}`, {
      method: 'POST',
      body: form,
    });
  },

  delete: (id: Source) => apiClient<{ deleted: string }>(`/datasets/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  }),

  validateInputs: () => apiClient<InputValidationResponse>('/datasets/validation'),
};
