import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logsService } from '../services/logs.service';
import { STALE_TIME } from '../utils/constants';

export function useTodayLogs() {
  return useQuery({
    queryKey: ['logs', 'today'],
    queryFn: () => logsService.getTodayLogs().then((res) => res.data),
    staleTime: STALE_TIME,
  });
}

export function useLogsByDate(date: string) {
  return useQuery({
    queryKey: ['logs', 'date', date],
    queryFn: () => logsService.getLogsByDate(date).then((res) => res.data),
    staleTime: STALE_TIME,
    enabled: !!date,
  });
}

export function useLogs(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['logs', startDate, endDate],
    queryFn: () => logsService.getLogs(startDate, endDate).then((res) => res.data),
    staleTime: STALE_TIME,
  });
}

export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ content, tag, logDate }: { content: string; tag: string; logDate: string }) =>
      logsService.createLog(content, tag, logDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useUpdateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content, tags }: { id: string; content: string; tags: string[] }) =>
      logsService.updateLog(id, content, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => logsService.deleteLog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs'] });
    },
  });
}
