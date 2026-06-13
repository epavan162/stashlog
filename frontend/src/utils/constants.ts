export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const MAX_LOG_LENGTH = 10000;

export const TAG_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: 'bug', label: '🐛 Bug', className: 'tag-bug' },
  { value: 'feature', label: '✨ Feature', className: 'tag-feature' },
  { value: 'review', label: '👀 Review', className: 'tag-review' },
  { value: 'blocked', label: '🚫 Blocked', className: 'tag-blocked' },
  { value: 'learning', label: '📚 Learning', className: 'tag-learning' },
];

export const TIMEZONE_OPTIONS = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const TAG_CLASS_MAP: Record<string, string> = {
  bug: 'tag-bug',
  feature: 'tag-feature',
  review: 'tag-review',
  blocked: 'tag-blocked',
  learning: 'tag-learning',
};
