import React from 'react';
import { Flame, Trophy } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Streak } from '../../types';

interface StreakBadgeProps {
  streak: Streak | null;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (!streak) return null;

  return (
    <Card className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Flame size={28} className="text-accent-amber" />
        <div>
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--fg)' }}>
            {streak.current_streak}
          </div>
          <div className="text-xs" style={{ color: 'var(--fg-faint)' }}>
            day streak
          </div>
        </div>
      </div>
      {streak.best_streak > 0 && (
        <div className="flex items-center gap-1.5 pl-4 border-l" style={{ borderColor: 'var(--line)' }}>
          <Trophy size={16} style={{ color: 'var(--accent-amber)' }} />
          <div>
            <div className="text-sm font-bold font-mono" style={{ color: 'var(--fg-dim)' }}>
              {streak.best_streak}
            </div>
            <div className="text-xs" style={{ color: 'var(--fg-faint)' }}>best</div>
          </div>
        </div>
      )}
    </Card>
  );
}
