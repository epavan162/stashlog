import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isWeekend, subMonths, addMonths } from 'date-fns';
import { useLogs } from '../../hooks/useLogs';
import { TagIcon } from '../ui/TagIcon';

interface CalendarViewProps {
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
  tagFilter?: string;
  summaries?: any[];
}

export function CalendarView({ onDateSelect, selectedDate, tagFilter, summaries }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
  const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

  const { data } = useLogs(start, end);

  const loggedDates = useMemo(() => {
    const map = new Map<string, { logged: boolean; tags: string[] }>();
    if (data?.logs) {
      for (const log of data.logs) {
        const dateKey = log.log_date.split('T')[0];
        const existing = map.get(dateKey);
        const tags = [...(existing?.tags || []), ...(log.tags || [])];
        map.set(dateKey, { logged: true, tags: [...new Set(tags)] });
      }
    }
    return map;
  }, [data]);

  const summaryDates = useMemo(() => {
    const set = new Set<string>();
    if (summaries) {
      for (const s of summaries) {
        if (s.summary_type === 'daily') {
          set.add(s.log_date.split('T')[0]);
        }
      }
    }
    return set;
  }, [summaries]);

  const getTagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'bug':
        return 'var(--error)';
      case 'feature':
        return 'var(--accent-teal)';
      case 'review':
        return 'var(--accent-purple)';
      case 'blocked':
        return 'var(--accent-amber)';
      case 'learning':
        return 'var(--accent-emerald)';
      default:
        return 'var(--fg-faint)';
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = getDay(startOfMonth(currentMonth));
  const paddingDays = startDay === 0 ? 6 : startDay - 1; // Monday start

  return (
    <div>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-bg-elev transition-smooth"
          style={{ color: 'var(--fg-dim)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-full hover:bg-bg-elev transition-smooth"
          style={{ color: 'var(--fg-dim)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-mono py-2"
            style={{ color: 'var(--fg-faint)' }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding */}
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Days */}
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const logInfo = loggedDates.get(dateKey);
          const logged = logInfo?.logged || false;
          const isWeekendDay = isWeekend(day);
          const isSelected = selectedDate === dateKey;
          const isTodayDay = isToday(day);

          const hasDailySummary = summaryDates.has(dateKey);

          // Tag filter
          const matchesFilter = !tagFilter || (logInfo?.tags?.includes(tagFilter) ?? false);
          const isHighlighted = logged && matchesFilter;
          const isFaded = tagFilter && !matchesFilter;

          const visibleTags = logged
            ? (tagFilter ? (logInfo?.tags?.includes(tagFilter) ? [tagFilter] : []) : (logInfo?.tags || []))
            : [];

          // Gather log summaries for cell hover tooltip
          const dayLogs = data?.logs?.filter((log: any) => log.log_date.split('T')[0] === dateKey) || [];
          const tooltipText = dayLogs.length > 0
            ? `${format(day, 'MMMM d, yyyy')}\n\n` + dayLogs.map((log: any) => `• [${log.tags?.[0]?.toUpperCase() || 'LOG'}] ${log.content}`).join('\n')
            : format(day, 'MMMM d, yyyy');

          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(dateKey)}
              title={tooltipText}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-between py-1.5 text-sm transition-smooth relative
                ${isSelected ? 'ring-2 ring-accent' : ''}
                ${isTodayDay ? 'ring-2 ring-accent/55' : ''}
                ${isHighlighted ? 'hover:brightness-110' : 'hover:bg-bg-elev'}
                ${isFaded ? 'opacity-30' : ''}
              `}
              style={{
                backgroundColor: isHighlighted
                  ? 'rgba(34,197,94,0.12)'
                  : 'transparent',
                color: isHighlighted ? 'var(--success)' : 'var(--fg-dim)',
              }}
            >
              {/* Sparkle or AI Badge */}
              {hasDailySummary && (
                <span className="absolute top-1 right-1 text-accent animate-pulse-dot" title="AI Summary Available">
                  <Sparkles size={8} className="fill-current text-accent-amber" />
                </span>
              )}

              <span className="font-mono text-xs mt-0.5">{format(day, 'd')}</span>

              {/* Tag Icons */}
              <div className="h-4 flex items-center justify-center gap-1 mt-auto">
                {visibleTags.slice(0, 3).map((tagVal) => (
                  <TagIcon key={tagVal} tag={tagVal} size={12} />
                ))}
                {visibleTags.length > 3 && (
                  <span className="text-[9px] font-bold leading-none mb-0.5 opacity-70" style={{ color: 'var(--fg-faint)' }}>
                    +{visibleTags.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg-faint)' }}>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.3)' }} />
          Logged
        </div>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg-faint)' }}>
          <div className="w-3 h-3 rounded" style={{ backgroundColor: 'var(--bg-elev)' }} />
          Missed
        </div>
      </div>
    </div>
  );
}
