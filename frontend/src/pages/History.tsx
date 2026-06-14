import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Calendar, ChevronDown, ChevronUp, Clock, Inbox, Sparkles } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { CalendarView } from '../components/history/CalendarView';
import { LogDetailModal } from '../components/history/LogDetailModal';
import { TAG_OPTIONS, STALE_TIME } from '../utils/constants';
import { getTodayForTimezone, getLocalDateTime, formatTime } from '../utils/helpers';
import api from '../services/api';
import type { Log } from '../types';
import { FormattedSummary } from '../components/ui/FormattedSummary';
import { TagIcon } from '../components/ui/TagIcon';

const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/^###\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\[(bug|feature|review|blocked|learning)\]/gi, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export default function History() {
  const [activeTab, setActiveTab] = useState<'date' | 'week'>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string>('');
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Fetch all summaries
  const { data: summariesData, isLoading: summariesLoading } = useQuery<any>({
    queryKey: ['summaries'],
    queryFn: () => api.get('/summaries').then((res) => res.data),
    staleTime: STALE_TIME,
  });

  // Fetch all logs
  const { data: logsData, isLoading: logsLoading } = useQuery<any>({
    queryKey: ['logs'],
    queryFn: () => api.get('/logs').then((res) => res.data),
    staleTime: STALE_TIME,
  });

  // Fetch current user details
  const { data: userData } = useQuery<any>({
    queryKey: ['user', 'me'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
    staleTime: STALE_TIME,
  });

  const user = userData?.user;
  const timezone = user?.timezone || 'Asia/Kolkata';

  // Filter logs for selected date
  const dateLogs = useMemo(() => {
    if (!selectedDate || !logsData?.logs) return [];
    return logsData.logs.filter((l: any) => l.log_date.split('T')[0] === selectedDate);
  }, [selectedDate, logsData]);

  // Find daily summary for selected date
  const dateSummary = useMemo(() => {
    if (!selectedDate || !summariesData?.summaries) return null;
    return summariesData.summaries.find(
      (s: any) => s.summary_type === 'daily' && s.log_date.split('T')[0] === selectedDate
    );
  }, [selectedDate, summariesData]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // Generate list of weeks from current week back to user registration week (max 10 weeks)
  const weeksList = useMemo(() => {
    if (!user?.created_at) return [];

    const weeks = [];
    const localTime = getLocalDateTime(timezone);

    // Current week setup
    let current = new Date(localTime);

    for (let i = 0; i < 10; i++) {
      const day = current.getDay();
      const daysFromMonday = day === 0 ? 6 : day - 1;
      const mon = new Date(current);
      mon.setDate(current.getDate() - daysFromMonday);
      mon.setHours(0, 0, 0, 0);

      const fri = new Date(mon);
      fri.setDate(mon.getDate() + 4);
      fri.setHours(23, 59, 59, 999);

      const monStr = mon.toISOString().split('T')[0];
      const friStr = fri.toISOString().split('T')[0];

      // Monday of registration week
      const userRegDate = new Date(user.created_at);
      const regDay = userRegDate.getDay();
      const regDaysFromMonday = regDay === 0 ? 6 : regDay - 1;
      const regMonday = new Date(userRegDate);
      regMonday.setDate(userRegDate.getDate() - regDaysFromMonday);
      regMonday.setHours(0, 0, 0, 0);

      if (mon.getTime() < regMonday.getTime()) {
        break;
      }

      weeks.push({
        mondayStr: monStr,
        fridayStr: friStr,
        monDate: mon,
        friDate: fri,
      });

      // Move current back to previous Sunday
      current = new Date(mon);
      current.setDate(mon.getDate() - 1);
    }
    return weeks;
  }, [user, timezone]);

  const getDaysLoggedForWeek = (monStr: string, friStr: string) => {
    if (!logsData?.logs) return 0;
    const monTime = new Date(monStr + 'T00:00:00').getTime();
    const friTime = new Date(friStr + 'T23:59:59').getTime();

    const uniqueDates = new Set<string>();
    logsData.logs.forEach((log: any) => {
      const dStr = log.log_date.split('T')[0];
      const dTime = new Date(dStr + 'T12:00:00').getTime();
      if (dTime >= monTime && dTime <= friTime) {
        uniqueDates.add(dStr);
      }
    });
    return uniqueDates.size;
  };

  const isCurrentWeek = (mondayStr: string) => {
    const localTime = getLocalDateTime(timezone);
    const dayOfWeek = localTime.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const curMon = new Date(localTime);
    curMon.setDate(localTime.getDate() - daysFromMonday);
    return curMon.toISOString().split('T')[0] === mondayStr;
  };

  const isNewUserForWeek = () => {
    if (!user?.created_at) return false;
    const diff = new Date().getTime() - new Date(user.created_at).getTime();
    return diff < 72 * 3600 * 1000;
  };

  const formatWeekRange = (mon: Date, fri: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    const yearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric' });
    return `${formatter.format(mon)} – ${formatter.format(fri)}, ${yearFormatter.format(fri)}`;
  };

  const getTagDetails = (tagValue: string) => {
    return TAG_OPTIONS.find((t) => t.value === tagValue) || { label: tagValue, className: 'tag-default' };
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--fg)' }}>
              History & Summaries
            </h1>

            {/* Tabs */}
            <div className="flex p-0.5 rounded-lg border text-sm" style={{ backgroundColor: 'var(--bg-elev)', borderColor: 'var(--line)' }}>
              <button
                onClick={() => setActiveTab('date')}
                className={`px-4 py-1.5 rounded-md font-medium transition-smooth ${
                  activeTab === 'date' ? 'bg-card shadow-sm text-accent font-semibold' : 'text-fg-dim hover:text-fg'
                }`}
                style={{ backgroundColor: activeTab === 'date' ? 'var(--bg-card)' : 'transparent' }}
              >
                By Date
              </button>
              <button
                onClick={() => setActiveTab('week')}
                className={`px-4 py-1.5 rounded-md font-medium transition-smooth ${
                  activeTab === 'week' ? 'bg-card shadow-sm text-accent font-semibold' : 'text-fg-dim hover:text-fg'
                }`}
                style={{ backgroundColor: activeTab === 'week' ? 'var(--bg-card)' : 'transparent' }}
              >
                By Week
              </button>
            </div>
          </div>

          {activeTab === 'date' ? (
            <div className="space-y-6">
              {/* Tag Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTagFilter('')}
                  className={`px-3 py-1.5 rounded-pill text-xs font-mono transition-smooth flex items-center gap-1.5 ${
                    !tagFilter ? 'bg-accent text-white font-semibold' : 'tag-default opacity-80 hover:opacity-100'
                  }`}
                >
                  <TagIcon tag="all" size={14} color={!tagFilter ? 'white' : undefined} />
                  <span>All</span>
                </button>
                {TAG_OPTIONS.map((tag) => {
                  const isSelected = tagFilter === tag.value;
                  return (
                    <button
                      key={tag.value}
                      onClick={() => setTagFilter(isSelected ? '' : tag.value)}
                      className={`px-3 py-1.5 rounded-pill text-xs font-mono transition-smooth flex items-center gap-1.5 ${
                        isSelected ? tag.className + ' ring-1 ring-current/30 font-semibold' : 'tag-default opacity-80 hover:opacity-100'
                      }`}
                    >
                      <TagIcon tag={tag.value} size={14} className={isSelected ? 'text-current' : ''} />
                      <span>{tag.label}</span>
                    </button>
                  );
                })}
              </div>

              <Card>
                <CalendarView
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  tagFilter={tagFilter || undefined}
                  summaries={summariesData?.summaries}
                />
              </Card>

              {/* Log Detail Modal */}
              <LogDetailModal
                isOpen={!!selectedDate}
                onClose={() => setSelectedDate(null)}
                date={selectedDate}
                initialTag={tagFilter}
              />
            </div>
          ) : (
            /* By Week Tab */
            <div className="space-y-4">
              {weeksList.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-card border" style={{ borderColor: 'var(--line)' }}>
                  <Inbox size={40} className="mx-auto mb-3 opacity-40 text-fg-dim" />
                  <p className="text-sm font-medium" style={{ color: 'var(--fg-dim)' }}>
                    No weeks logged yet.
                  </p>
                </div>
              ) : (
                weeksList.map((week) => {
                  const daysLogged = getDaysLoggedForWeek(week.mondayStr, week.fridayStr);
                  const isCur = isCurrentWeek(week.mondayStr);

                  // Find matching weekly summary
                  const weekSummary = summariesData?.summaries?.find(
                    (s: any) => s.summary_type === 'weekly' && s.log_date.split('T')[0] === week.mondayStr
                  );

                  const isExpanded = expandedWeek === week.mondayStr;

                  return (
                    <div
                      key={week.mondayStr}
                      className="p-5 rounded-card border transition-smooth"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--line)',
                      }}
                    >
                      <div
                        className="flex items-center justify-between cursor-pointer gap-4"
                        onClick={() => {
                          if (weekSummary || isCur || isNewUserForWeek() || daysLogged === 0) {
                            setExpandedWeek(isExpanded ? null : week.mondayStr);
                          }
                        }}
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold text-md" style={{ color: 'var(--fg)' }}>
                            {formatWeekRange(week.monDate, week.friDate)}
                          </h4>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--fg-faint)' }}>
                            <span className="font-semibold" style={{ color: daysLogged > 0 ? 'var(--success)' : 'var(--fg-faint)' }}>
                              {daysLogged} / 5 days logged
                            </span>
                          </div>
                        </div>

                        {(weekSummary || isCur || isNewUserForWeek() || daysLogged === 0) && (
                          <div style={{ color: 'var(--fg-faint)' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        )}
                      </div>

                      {/* Expandable Section */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden border-t pt-4"
                            style={{ borderColor: 'var(--line)' }}
                          >
                            {weekSummary ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                                  <Sparkles size={14} />
                                  Weekly standup summary
                                </div>
                                <FormattedSummary text={weekSummary.generated_summary} />
                              </div>
                            ) : isNewUserForWeek() ? (
                              <p className="text-sm italic" style={{ color: 'var(--fg-faint)' }}>
                                Start logging next week to get your weekly summary
                              </p>
                            ) : daysLogged === 0 ? (
                              <p className="text-sm italic" style={{ color: 'var(--fg-faint)' }}>
                                Nothing logged this week
                              </p>
                            ) : isCur ? (
                              <p className="text-sm italic" style={{ color: 'var(--fg-faint)' }}>
                                Weekly summary generates Friday at 11 PM
                              </p>
                            ) : (
                              <p className="text-sm italic" style={{ color: 'var(--fg-faint)' }}>
                                Nothing logged this week
                              </p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Preview (when not expanded) */}
                      {!isExpanded && weekSummary && (
                        <div className="text-xs mt-2 truncate font-sans" style={{ color: 'var(--fg-faint)' }}>
                          {stripMarkdown(weekSummary.generated_summary).slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
