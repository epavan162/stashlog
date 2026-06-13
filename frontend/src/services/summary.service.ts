import api from './api';
import type { SummaryResponse, SummariesResponse } from '../types';

export const summaryService = {
  getSummaries: (startDate?: string, endDate?: string) =>
    api.get<SummariesResponse>('/summaries', { params: { start_date: startDate, end_date: endDate } }),

  getSummaryByDate: (date: string) =>
    api.get<SummaryResponse>(`/summaries/date/${date}`),

  regenerateSummary: (date: string) =>
    api.post<SummaryResponse>(`/summaries/regenerate/${date}`),

  getWeeklySummary: (weekDate: string) =>
    api.get(`/summaries/weekly/${weekDate}`),
};
