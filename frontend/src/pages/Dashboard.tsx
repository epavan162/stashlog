import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LogEditor } from '../components/dashboard/LogEditor';
import { SummaryCard } from '../components/dashboard/SummaryCard';
import { StreakBadge } from '../components/dashboard/StreakBadge';
import { WeekProgress } from '../components/dashboard/WeekProgress';
import { ContextBanner } from '../components/dashboard/ContextBanner';
import { WeekendScreen } from '../components/dashboard/WeekendScreen';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/authStore';
import { getGreeting, getLocalDateTime } from '../utils/helpers';
import { STALE_TIME } from '../utils/constants';
import api from '../services/api';

export default function Dashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: () => api.get('/users/me').then((res) => res.data),
    staleTime: STALE_TIME,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 px-4" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="max-w-5xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  const streak = userData?.streak || null;
  const timezone = userData?.user?.timezone || 'Asia/Kolkata';
  const localTime = getLocalDateTime(timezone);
  const day = localTime.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = localTime.getHours();
  const isWeekend = day === 0 || day === 6;
  const isSaturdayGraceWindow = day === 6 && hour < 10;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Greeting */}
          <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--fg)' }}>
            {getGreeting(user?.name || 'there')}
          </h1>

          {/* Context Banner */}
          <ContextBanner />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Editor or Weekend Screen */}
            <div className="lg:col-span-3">
              {isWeekend && !isSaturdayGraceWindow ? (
                <Card>
                  <WeekendScreen user={userData?.user} streak={streak} />
                </Card>
              ) : (
                <Card>
                  <LogEditor />
                </Card>
              )}
            </div>

            {/* Right: Summary + Stats */}
            <div className="lg:col-span-2 space-y-4">
              <SummaryCard />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <StreakBadge streak={streak} />
                <WeekProgress streak={streak} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
