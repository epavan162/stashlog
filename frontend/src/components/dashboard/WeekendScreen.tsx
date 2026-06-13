import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Flame, Inbox, Sparkles } from 'lucide-react';
import { STALE_TIME } from '../../utils/constants';
import { getTodayForTimezone, getLocalDateTime } from '../../utils/helpers';
import api from '../../services/api';

interface WeekendScreenProps {
  user: any;
  streak: any;
}

export function WeekendScreen({ user, streak }: WeekendScreenProps) {
  const timezone = user?.timezone || 'Asia/Kolkata';
  const localTime = getLocalDateTime(timezone);
  
  // Find Monday of the current week
  const dayOfWeek = localTime.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(localTime);
  monday.setDate(localTime.getDate() - daysFromMonday);
  const mondayStr = monday.toISOString().split('T')[0];

  // Fetch weekly summary
  const { data: weeklyData, isLoading } = useQuery<any>({
    queryKey: ['summary', 'weekly', mondayStr],
    queryFn: () => api.get(`/summaries/weekly/${mondayStr}`).then((res) => res.data),
    staleTime: STALE_TIME,
  });

  const isNewUser = React.useMemo(() => {
    if (!user?.created_at) return false;
    const diff = new Date().getTime() - new Date(user.created_at).getTime();
    return diff < 72 * 3600 * 1000; // registered < 3 days ago
  }, [user]);

  const weeklySummary = weeklyData?.weekly_summary;

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <motion.h2
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-accent to-accent-amber bg-clip-text text-transparent"
        >
          Rest up! 🎉
        </motion.h2>
        <p className="text-sm" style={{ color: 'var(--fg-dim)' }}>
          Here's your week in review
        </p>
      </div>

      {/* Weekly Summary Card */}
      <div className="p-6 rounded-card border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--line)' }}>
        <h3 className="text-md font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--fg)' }}>
          <Sparkles size={16} className="text-accent-amber" />
          Weekly AI Summary
        </h3>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-line-strong rounded w-3/4"></div>
            <div className="h-4 bg-line-strong rounded w-full"></div>
            <div className="h-4 bg-line-strong rounded w-5/6"></div>
          </div>
        ) : isNewUser ? (
          <div className="text-center py-6 text-sm" style={{ color: 'var(--fg-faint)' }}>
            <Inbox size={32} className="mx-auto mb-2 opacity-50" />
            Start logging next week to get your weekly summary
          </div>
        ) : !weeklySummary ? (
          <div className="text-center py-6 text-sm" style={{ color: 'var(--fg-faint)' }}>
            <Inbox size={32} className="mx-auto mb-2 opacity-50" />
            Nothing logged this week
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'var(--fg-dim)' }}>
            {weeklySummary.generated_summary}
          </div>
        )}
      </div>

      {/* Streak Count card */}
      <div
        className="p-5 rounded-card border flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-elev)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Flame size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>
              Current Streak
            </div>
            <div className="text-xs" style={{ color: 'var(--fg-faint)' }}>
              Keep up the weekday momentum!
            </div>
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-orange-500">
          🔥 {streak?.current_streak || 0}
        </div>
      </div>

      {/* Closing Message */}
      <div className="text-center pt-4 text-sm font-medium" style={{ color: 'var(--fg-faint)' }}>
        See you Monday 🚀
      </div>
    </div>
  );
}
