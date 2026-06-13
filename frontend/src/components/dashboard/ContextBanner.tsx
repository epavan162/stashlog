import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTodayLogs } from '../../hooks/useLogs';
import { useQuery } from '@tanstack/react-query';
import { STALE_TIME } from '../../utils/constants';
import { getLocalDateTime } from '../../utils/helpers';
import api from '../../services/api';

export function ContextBanner() {
  const { data: todayLogsData } = useTodayLogs();
  
  const { data: userData } = useQuery<any>({
    queryKey: ['user', 'me'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
    staleTime: STALE_TIME,
  });

  const banner = useMemo(() => {
    if (!userData) return null;

    // Email bounce warning (highest priority)
    if (userData.email_bounced) {
      return {
        message: "Warning: Your email notifications are bouncing. Please check your settings.",
        emoji: "⚠️",
        type: 'warning' as const
      };
    }

    const timezone = userData.user?.timezone || 'Asia/Kolkata';
    const localTime = getLocalDateTime(timezone);
    const hour = localTime.getHours();
    const day = localTime.getDay(); // 0 = Sunday, 1 = Monday, 6 = Saturday

    const weekStatus = userData.streak?.week_status || [];
    const loggedDaysCount = weekStatus.filter((d: any) => d.logged).length;

    // Saturday before 10 AM
    if (day === 6 && hour < 10) {
      return {
        message: "Forgot to log Friday's work? You have until 10 AM today to add it ⏰",
        emoji: "⏰",
        type: 'warning' as const
      };
    }

    // Saturday after 10 AM
    if (day === 6 && hour >= 10) {
      return {
        message: "Rest up this weekend! 🎉 Your weekly summary is ready below.",
        emoji: "🎉",
        type: 'success' as const
      };
    }

    // Sunday (all day)
    if (day === 0) {
      return {
        message: "One more day of rest! See you Monday 🚀",
        emoji: "🚀",
        type: 'info' as const
      };
    }

    // Friday after 6 PM
    if (day === 5 && hour >= 18) {
      return {
        message: `Great week! You logged ${loggedDaysCount} days. Enjoy your weekend 🎉`,
        emoji: "🎉",
        type: 'success' as const
      };
    }

    // Monday morning (before noon)
    if (day === 1 && hour < 12) {
      return {
        message: "Welcome back! Ready to crush this week? 🚀",
        emoji: "🚀",
        type: 'info' as const
      };
    }

    // After 8 PM on weekday + no log today
    const hasLogToday = todayLogsData?.logs && todayLogsData.logs.length > 0;
    const isWeekday = day >= 1 && day <= 5;
    if (hour >= 20 && !hasLogToday && isWeekday) {
      return {
        message: "Hey, you haven't logged anything today! Don't break your streak 🔥",
        emoji: "🔥",
        type: 'warning' as const
      };
    }

    return null;
  }, [userData, todayLogsData]);

  if (!banner) return null;

  const bgColors = {
    info: 'rgba(45, 166, 179, 0.06)',
    warning: 'rgba(245, 158, 11, 0.06)',
    success: 'rgba(34, 197, 94, 0.06)',
  };

  const borderColors = {
    info: 'rgba(45, 166, 179, 0.15)',
    warning: 'rgba(245, 158, 11, 0.15)',
    success: 'rgba(34, 197, 94, 0.15)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-5 py-3.5 rounded-card border text-sm font-medium flex items-center gap-3"
      style={{
        backgroundColor: bgColors[banner.type],
        borderColor: borderColors[banner.type],
        color: 'var(--fg-dim)',
      }}
    >
      <span className="text-xl">{banner.emoji}</span>
      {banner.message}
    </motion.div>
  );
}
