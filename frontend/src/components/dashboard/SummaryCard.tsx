import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { summaryService } from '../../services/summary.service';
import { format, subDays } from 'date-fns';
import { copyToClipboard } from '../../utils/helpers';
import { STALE_TIME } from '../../utils/constants';
import { SummaryCardSkeleton } from '../ui/Skeleton';
import { FormattedSummary } from '../ui/FormattedSummary';

export function SummaryCard() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const hour = new Date().getHours();
  const isBeforeOneAM = hour < 1;

  const { data, isLoading, error } = useQuery({
    queryKey: ['summary', yesterday],
    queryFn: () => summaryService.getSummaryByDate(yesterday).then((res) => res.data),
    staleTime: STALE_TIME,
    retry: false,
  });

  const regenerate = useMutation({
    mutationFn: () => summaryService.regenerateSummary(yesterday),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summary', yesterday] });
      addToast('success', 'Summary regenerated!');
    },
    onError: (err: any) => {
      addToast('error', err?.response?.data?.error || 'Failed to regenerate');
    },
  });

  const handleCopy = async () => {
    if (data?.summary?.generated_summary) {
      await copyToClipboard(data.summary.generated_summary);
      setCopied(true);
      addToast('success', 'Standup copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <SummaryCardSkeleton />;

  if (isBeforeOneAM) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-sm font-medium" style={{ color: 'var(--fg-dim)' }}>
            Your summary will be ready after 1 AM tonight
          </p>
        </div>
      </Card>
    );
  }

  if (error || !data?.summary) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-sm mb-2" style={{ color: 'var(--fg-dim)' }}>
            No summary available for yesterday
          </p>
          <p className="text-xs" style={{ color: 'var(--fg-faint)' }}>
            Summaries are generated at 1 AM from your daily logs
          </p>
        </div>
      </Card>
    );
  }

  const { summary } = data;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
            Yesterday's Standup
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => regenerate.mutate()}
              isLoading={regenerate.isPending}
              disabled={summary.regeneration_count >= 1}
              className="gap-1.5"
            >
              <RefreshCw size={14} />
              Regenerate
            </Button>
          </div>
        </div>

        {summary.is_fallback && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--warning)' }}>
            <AlertTriangle size={14} />
            AI formatting was unavailable. Here are your raw logs:
          </div>
        )}

        <FormattedSummary text={summary.generated_summary} />

        {summary.regeneration_count >= 1 && (
          <p className="text-xs" style={{ color: 'var(--fg-faint)' }}>
            Regeneration limit reached (1 per day)
          </p>
        )}
      </div>
    </Card>
  );
}
