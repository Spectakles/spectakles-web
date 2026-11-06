import { useCallback } from 'react';
import { responseError, usePlatform } from './context';

export function useApi() {
  const { request } = usePlatform();
  return useCallback(async <T,>(path: string, value?: unknown, method = 'POST'): Promise<T> => {
    const response = await request(path, value === undefined ? {} : {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
    });
    if (!response.ok) throw await responseError(response);
    return response.json() as Promise<T>;
  }, [request]);
}
export type Cohort = { id: string; name: string; student_uids: string[] };
export type Member = { uid: string; name: string; email: string; role: string };
export type Assignment = {
  id: string; title: string; organization_id: string; cohort_name: string;
  opens_at: string; due_at: string; max_attempts: number; closed: boolean;
  attempts_used: number; attempts_reserved: number; attempts_remaining: number;
  template: import('./context').Template;
};
export const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
