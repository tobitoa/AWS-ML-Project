import { apiClient } from './client';
import type { Health } from '@/lib/types';

export const healthApi = {
  check: () => apiClient<Health>('/health'),
};
