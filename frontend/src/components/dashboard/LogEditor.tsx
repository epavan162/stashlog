import React, { useState, useCallback } from 'react';
import { Plus, Trash2, Lock, AlertCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { useCreateLog, useDeleteLog } from '../../hooks/useLogs';
import { MAX_LOG_LENGTH, TAG_OPTIONS, STALE_TIME } from '../../utils/constants';
import { getCharCountDisplay, getTodayForTimezone, formatTime, getLocalDateTime } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import type { Log } from '../../types';
import { TagIcon } from '../ui/TagIcon';

export function LogEditor() {
  const user = useAuthStore((s) => s.user);
  const createLog = useCreateLog();
  const deleteLog = useDeleteLog();
  const { addToast } = useToast();

  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const timezone = user?.timezone || 'Asia/Kolkata';
  const activeDate = getTodayForTimezone(timezone);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['logs', 'date', activeDate],
    queryFn: () => api.get(`/logs/date/${activeDate}`).then((res) => res.data),
    staleTime: STALE_TIME,
  });

  const logsList: Log[] = data?.logs || [];

  // Sort logs by created_at desc (newest at top)
  const sortedLogs = [...logsList].sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const handleAddLog = useCallback(async () => {
    const trimmed = content.trim();
    
    if (!trimmed) {
      setValidationError('Log entry cannot be empty');
      return;
    }
    
    if (!selectedTag) {
      setValidationError('Please select a tag before saving');
      return;
    }

    setValidationError('');

    try {
      await createLog.mutateAsync({
        content: trimmed,
        tag: selectedTag,
        logDate: activeDate,
      });
      setContent('');
      setSelectedTag('');
      addToast('success', 'Log entry saved ✓');
    } catch (err: any) {
      addToast('error', err?.response?.data?.error || 'Failed to save log');
    }
  }, [content, selectedTag, activeDate, createLog, addToast]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      try {
        await deleteLog.mutateAsync(id);
        addToast('success', 'Log entry deleted successfully');
      } catch (err: any) {
        addToast('error', err?.response?.data?.error || 'Failed to delete log');
      }
    }
  };

  const getTagDetails = (tagValue: string) => {
    return TAG_OPTIONS.find((t) => t.value === tagValue) || { label: tagValue, className: 'tag-default' };
  };

  const isPastMidnight = (logDateStr: string) => {
    const todayStr = getTodayForTimezone(timezone);
    const lDate = logDateStr.split('T')[0];
    return lDate !== todayStr;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-6 w-48" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
          Add Log Entry
        </h3>

        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value.slice(0, MAX_LOG_LENGTH));
              if (e.target.value.trim()) setValidationError('');
            }}
            placeholder="What did you work on? Be specific..."
            className="w-full min-h-[120px] p-4 rounded-card border resize-y text-sm leading-relaxed outline-none transition-smooth focus:border-accent focus:ring-1 focus:ring-accent/20"
            style={{
              backgroundColor: 'var(--bg-elev)',
              borderColor: 'var(--line-strong)',
              color: 'var(--fg)',
            }}
          />
          <div className="absolute bottom-3 right-3 font-mono text-xs px-2 py-1 rounded-md"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: content.length > MAX_LOG_LENGTH * 0.9 ? 'var(--warning)' : 'var(--fg-faint)',
            }}>
            {getCharCountDisplay(content.length, MAX_LOG_LENGTH)}
          </div>
        </div>

        {/* Tags Selector */}
        <div className="space-y-2">
          <div className="text-xs font-medium" style={{ color: 'var(--fg-dim)' }}>
            Select Tag (Required)
          </div>
          <div className="flex flex-wrap gap-2">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = selectedTag === tag.value;
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => {
                    setSelectedTag(isSelected ? '' : tag.value);
                    if (!isSelected) setValidationError('');
                  }}
                  className={`
                    px-3 py-1.5 rounded-pill text-xs font-mono transition-smooth select-none flex items-center gap-1.5
                    ${isSelected ? `${tag.className} ring-1 ring-current/30 font-semibold scale-102` : 'tag-default opacity-60 hover:opacity-100'}
                  `}
                >
                  <TagIcon tag={tag.value} size={14} className={isSelected ? 'text-current' : 'opacity-85'} />
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--error)' }}>
            <AlertCircle size={14} />
            {validationError}
          </div>
        )}

        <Button
          onClick={handleAddLog}
          isLoading={createLog.isPending}
          className="gap-2"
        >
          <Plus size={16} />
          Add Log
        </Button>
      </div>

      {/* Divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--line)' }} />

      {/* Entries List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-dim)' }}>
            {sortedLogs.length} {sortedLogs.length === 1 ? 'entry' : 'entries'} today
          </h4>
        </div>

        {sortedLogs.length === 0 ? (
          <div className="text-center py-8 rounded-card border border-dashed" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-elev)' }}>
            <p className="text-sm" style={{ color: 'var(--fg-faint)' }}>
              No logs yet. Add your first entry above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedLogs.map((log) => {
              const tag = getTagDetails(log.tags?.[0] || '');
              const locked = isPastMidnight(log.log_date);
              return (
                <div
                  key={log.id}
                  className="p-4 rounded-card border transition-smooth flex items-start justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--line)',
                  }}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded-pill text-[10px] font-mono ${tag.className}`}>
                        {tag.label}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>
                        <Clock size={10} />
                        Saved at {formatTime(log.created_at)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed" style={{ color: 'var(--fg)' }}>
                      {log.content}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {locked ? (
                      <div className="p-1.5 rounded-full" style={{ color: 'var(--fg-faint)' }} title="Locked after midnight">
                        <Lock size={14} />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDelete(log.id)}
                        className="p-1.5 rounded-full hover:bg-red-500/10 transition-smooth text-red-500 hover:text-red-600"
                        title="Delete log entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
