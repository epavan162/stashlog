import api from './api';
import type { LogsResponse } from '../types';

export const logsService = {
  getLogs: (startDate?: string, endDate?: string) =>
    api.get<LogsResponse>('/logs', { params: { start_date: startDate, end_date: endDate } }),

  createLog: (content: string, tag: string, logDate: string) =>
    api.post('/logs', { content, tag, log_date: logDate }),

  updateLog: (id: string, content: string, tags: string[]) =>
    api.put(`/logs/${id}`, { content, tags }),

  deleteLog: (id: string) =>
    api.delete(`/logs/${id}`),

  getTodayLogs: () =>
    api.get<LogsResponse>('/logs/today'),

  getLogsByDate: (date: string) =>
    api.get<LogsResponse>(`/logs/date/${date}`),
};
