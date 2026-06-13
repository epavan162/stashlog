import React from 'react';
import { Card } from '../ui/Card';
import type { Streak } from '../../types';

interface WeekProgressProps {
  streak: Streak | null;
}

export function WeekProgress({ streak }: WeekProgressProps) {
  if (!streak) return null;

  return (
    <Card>
      <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--fg-dim)' }}>
        This Week
      </h4>
      <div className="flex items-center gap-2">
        {streak.week_status.map((day) => (
          <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className={`
                w-full aspect-square rounded-lg flex items-center justify-center text-xs font-mono transition-smooth
                ${day.logged
                  ? 'bg-success/20 border border-success/30'
                  : 'border border-line-strong'
                }
              `}
              style={{
                backgroundColor: day.logged ? undefined : 'var(--bg-elev)',
                color: day.logged ? 'var(--success)' : 'var(--fg-faint)',
              }}
            >
              {day.logged ? '✓' : ''}
            </div>
            <span className="text-[10px] font-mono" style={{ color: 'var(--fg-faint)' }}>
              {day.day}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
