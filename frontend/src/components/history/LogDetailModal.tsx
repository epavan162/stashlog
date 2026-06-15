import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Copy, Check, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { logsService } from '../../services/logs.service';
import { summaryService } from '../../services/summary.service';
import { copyToClipboard, getLocalDateTime, getTodayForTimezone, getTagClassName } from '../../utils/helpers';
import { STALE_TIME, TAG_OPTIONS } from '../../utils/constants';
import { Skeleton } from '../ui/Skeleton';
import api from '../../services/api';
import { FormattedSummary } from '../ui/FormattedSummary';
import { TagIcon } from '../ui/TagIcon';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  initialTag?: string;
}

export function LogDetailModal({ isOpen, onClose, date, initialTag }: LogDetailModalProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'logs' | 'summary'>('logs');

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Fetch current user details for timezone
  const { data: userData } = useQuery<any>({
    queryKey: ['user', 'me'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
    staleTime: STALE_TIME,
    enabled: isOpen,
  });

  const timezone = userData?.user?.timezone || 'Asia/Kolkata';

  // Fetch logs for the selected date
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['logs', 'date', date],
    queryFn: () => logsService.getLogsByDate(date || '').then((res) => res.data),
    staleTime: STALE_TIME,
    enabled: isOpen && !!date,
  });

  // Fetch daily summary for the selected date
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['summary', date],
    queryFn: () => summaryService.getSummaryByDate(date || '').then((res) => res.data),
    staleTime: STALE_TIME,
    enabled: isOpen && !!date,
    retry: false,
  });

  const logs = logsData?.logs || [];
  const summary = summaryData?.summary;

  // Format Header Date
  const formattedDate = useMemo(() => {
    if (!date) return '';
    try {
      return format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy');
    } catch {
      return date;
    }
  }, [date]);

  // Collect unique tags that exist on this day's entries
  const tagsInDay = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l: any) => {
      if (l.tags && l.tags.length > 0) {
        set.add(l.tags[0].toLowerCase());
      }
    });
    return Array.from(set);
  }, [logs]);

  // Sync filter tab with initialTag when date/modal opens/changes
  useEffect(() => {
    if (isOpen) {
      const tag = initialTag?.toLowerCase() || 'all';
      if (tag === 'all' || tagsInDay.includes(tag)) {
        setActiveTab(tag);
      } else {
        setActiveTab('all');
      }
      setViewMode('logs');
    }
  }, [isOpen, date, initialTag, tagsInDay]);

  // Modal tab options: show All, plus tags present on that day
  const modalTabs = useMemo(() => {
    const baseTabs = [
      { value: 'all', label: 'All' },
      { value: 'bug', label: 'Bug' },
      { value: 'feature', label: 'Feature' },
      { value: 'review', label: 'Review' },
      { value: 'blocked', label: 'Blocked' },
      { value: 'learning', label: 'Learning' },
    ];
    return baseTabs.filter(tab => tab.value === 'all' || tagsInDay.includes(tab.value));
  }, [tagsInDay]);

  // Sort logs oldest first
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a: any, b: any) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
  }, [logs]);

  // Filter logs by selected tab
  const filteredLogs = useMemo(() => {
    if (activeTab === 'all') return sortedLogs;
    return sortedLogs.filter((l: any) => l.tags && l.tags[0]?.toLowerCase() === activeTab);
  }, [sortedLogs, activeTab]);

  // Clipboard copy action
  const handleCopy = async () => {
    if (summary?.generated_summary) {
      await copyToClipboard(summary.generated_summary);
      setCopied(true);
      addToast('success', 'Copied to clipboard ✓');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isTodaySelected = date === getTodayForTimezone(timezone);
  const localTime = getLocalDateTime(timezone);
  const hour = localTime.getHours();
  const isBeforeOneAM = hour < 1;

  const getTagLabel = (tagValue: string) => {
    const found = TAG_OPTIONS.find(t => t.value === tagValue);
    return found ? found.label : tagValue;
  };

  // Back backdrop and modal animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 },
    visible: isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.95, y: 20 },
  };

  return (
    <AnimatePresence>
      {isOpen && date && (
        <>
          {/* Backdrop blur */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={backdropVariants}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={modalVariants}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`
                w-full bg-card border shadow-2xl flex flex-col overflow-hidden
                ${isMobile ? 'h-[92vh] rounded-t-2xl' : 'max-w-4xl h-[80vh] rounded-card'}
              `}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--line)',
              }}
            >
              {/* Header */}
              <div className="p-5 border-b flex items-start justify-between gap-4" style={{ borderColor: 'var(--line)' }}>
                <div>
                  <h2 className="text-xl font-bold font-sans" style={{ color: 'var(--fg)' }}>
                    {formattedDate}
                  </h2>
                  <p className="text-xs mt-1 font-medium" style={{ color: 'var(--fg-faint)' }}>
                    {logsLoading ? 'Checking logs...' : `${logs.length} ${logs.length === 1 ? 'entry' : 'entries'}`}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-bg-elev transition-smooth"
                  style={{ color: 'var(--fg-faint)' }}
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Desktop Only: Sub-tabs for log tags filter */}
              {!isMobile && logs.length > 0 && modalTabs.length > 1 && (
                <div className="px-5 py-3 border-b flex flex-wrap gap-1.5" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-elev)' }}>
                  {modalTabs.map((tab) => {
                    const isSelected = activeTab === tab.value;
                    const selectedClass = tab.value === 'all'
                      ? 'bg-accent text-white font-semibold'
                      : `tag-${tab.value} ring-1 ring-current/35 font-semibold`;

                    return (
                      <button
                        key={tab.value}
                        onClick={() => setActiveTab(tab.value)}
                        className={`
                          px-3 py-1.5 rounded-pill text-xs font-mono transition-smooth select-none flex items-center gap-1.5
                          ${isSelected ? selectedClass : 'tag-default opacity-80 hover:opacity-100 hover:bg-line-strong'}
                        `}
                      >
                        <TagIcon 
                          tag={tab.value} 
                          size={14} 
                          color={isSelected && tab.value === 'all' ? 'white' : undefined} 
                        />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Mobile Only: Tab switcher for Log Entries vs AI Summary */}
              {isMobile && (
                <div className="flex border-b text-sm font-medium" style={{ borderColor: 'var(--line)', backgroundColor: 'var(--bg-elev)' }}>
                  <button
                    onClick={() => setViewMode('logs')}
                    className="flex-1 py-3 text-center border-b-2 transition-smooth"
                    style={{
                      borderColor: viewMode === 'logs' ? 'var(--accent)' : 'transparent',
                      color: viewMode === 'logs' ? 'var(--fg)' : 'var(--fg-dim)',
                      fontWeight: viewMode === 'logs' ? 600 : 500
                    }}
                  >
                    Log Entries
                  </button>
                  <button
                    onClick={() => setViewMode('summary')}
                    className="flex-1 py-3 text-center border-b-2 transition-smooth"
                    style={{
                      borderColor: viewMode === 'summary' ? 'var(--accent)' : 'transparent',
                      color: viewMode === 'summary' ? 'var(--fg)' : 'var(--fg-dim)',
                      fontWeight: viewMode === 'summary' ? 600 : 500
                    }}
                  >
                    AI Summary
                  </button>
                </div>
              )}

              {/* Panels split */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                {/* Left Panel: Log Entries */}
                {(!isMobile || viewMode === 'logs') && (
                  <div className="flex-1 overflow-y-auto p-5 md:border-r" style={{ borderColor: 'var(--line)' }}>
                    {/* Mobile Only: Inline tags filter in Logs view */}
                    {isMobile && logs.length > 0 && modalTabs.length > 1 && (
                      <div className="mb-4 flex flex-wrap gap-1.5 pb-3 border-b" style={{ borderColor: 'var(--line)' }}>
                        {modalTabs.map((tab) => {
                          const isSelected = activeTab === tab.value;
                          const selectedClass = tab.value === 'all'
                            ? 'bg-accent text-white font-semibold'
                            : `tag-${tab.value} ring-1 ring-current/35 font-semibold`;

                          return (
                            <button
                              key={tab.value}
                              onClick={() => setActiveTab(tab.value)}
                              className={`
                                px-2.5 py-1 rounded-pill text-[10px] font-mono transition-smooth select-none flex items-center gap-1
                                ${isSelected ? selectedClass : 'tag-default opacity-85 hover:opacity-100 hover:bg-line-strong'}
                              `}
                            >
                              <TagIcon 
                                tag={tab.value} 
                                size={11} 
                                color={isSelected && tab.value === 'all' ? 'white' : undefined} 
                              />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--fg-faint)' }}>
                      Log Entries
                    </h3>

                    {logsLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-12">
                        <Inbox size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium" style={{ color: 'var(--fg-faint)' }}>
                          No logs recorded for this day
                        </p>
                      </div>
                    ) : filteredLogs.length === 0 ? (
                      <div className="text-center py-12">
                        <Inbox size={32} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium" style={{ color: 'var(--fg-faint)' }}>
                          No {activeTab} entries for this day
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredLogs.map((log: any) => {
                          const tagClass = getTagClassName(log.tags?.[0] || '');
                          return (
                            <div
                              key={log.id}
                              className="p-4 rounded-card border"
                              style={{
                                backgroundColor: 'var(--bg-elev)',
                                borderColor: 'var(--line)',
                              }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-pill text-[10px] font-mono ${tagClass}`}>
                                  <TagIcon tag={log.tags?.[0] || ''} size={12} className="text-current opacity-95" />
                                  <span>{getTagLabel(log.tags?.[0] || '')}</span>
                                </span>
                                {log.created_at && (
                                  <span className="text-[10px] font-mono flex items-center gap-1" style={{ color: 'var(--fg-faint)' }}>
                                    <Clock size={10} />
                                    Saved at {format(new Date(log.created_at), 'h:mm a')}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--fg)' }}>
                                {log.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Right Panel: AI Summary */}
                {(!isMobile || viewMode === 'summary') && (
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--fg-faint)' }}>
                        <Sparkles size={13} className="text-accent-amber" />
                        AI Summary
                      </h3>
                      {summary && (
                        <Button
                          onClick={handleCopy}
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 px-2.5 py-1 h-7 text-[10px] uppercase font-mono tracking-wider flex items-center"
                          style={{ backgroundColor: 'var(--bg-elev)', color: 'var(--fg)' }}
                        >
                          {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                          <span>{copied ? 'Copied ✓' : 'Copy'}</span>
                        </Button>
                      )}
                    </div>

                    {summaryLoading ? (
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    ) : logs.length === 0 ? (
                      <div className="text-center py-12 text-sm" style={{ color: 'var(--fg-faint)' }}>
                        No summary available — no logs were recorded
                      </div>
                    ) : summary ? (
                      <div className="space-y-4">
                        {summary.is_fallback && (
                          <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--warning)' }}>
                            <AlertTriangle size={14} />
                            AI formatting was unavailable for this day
                          </div>
                        )}
                        <FormattedSummary text={summary.generated_summary} date={formattedDate} />
                      </div>
                    ) : isTodaySelected && isBeforeOneAM ? (
                      <div className="text-center py-12 text-sm font-medium" style={{ color: 'var(--fg-faint)' }}>
                        Summary will be generated after 1 AM tonight
                      </div>
                    ) : (
                      <div className="text-center py-12 text-sm font-medium" style={{ color: 'var(--fg-faint)' }}>
                        No summary generated
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
