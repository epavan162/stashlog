import { format, isToday, isYesterday, startOfWeek, addDays } from 'date-fns';

export function getGreeting(name: string): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 17) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  return `${greeting}, ${name}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

export function formatDateShort(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d');
}

export function formatLogDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mm a');
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return formatDate(dateStr);
}

export function getCharCountDisplay(count: number, max: number): string {
  return `${count.toLocaleString()} / ${max.toLocaleString()}`;
}

export function getTagClassName(tag: string): string {
  const map: Record<string, string> = {
    bug: 'tag-bug',
    feature: 'tag-feature',
    review: 'tag-review',
    blocked: 'tag-blocked',
    learning: 'tag-learning',
  };
  return map[tag] || 'tag-default';
}

export function getContextBanner(timezone: string): { message: string; emoji: string; type: 'info' | 'warning' | 'success' } | null {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Friday after 6 PM
  if (day === 5 && hour >= 18) {
    return { message: "Great week! Enjoy your weekend", emoji: "🎉", type: 'success' };
  }

  // Saturday or Sunday
  if (day === 0 || day === 6) {
    return { message: "Weekend Warrior! Logging on a weekend counts as bonus", emoji: "💪", type: 'info' };
  }

  // Monday morning (before noon)
  if (day === 1 && hour < 12) {
    return { message: "Welcome back! Ready to crush this week?", emoji: "🚀", type: 'info' };
  }

  // After 8 PM on weekday
  if (hour >= 20) {
    return { message: "Don't forget to log today! Don't break your streak", emoji: "🔥", type: 'warning' };
  }

  return null;
}

export function getTodayForTimezone(timezone?: string): string {
  if (!timezone) return formatLogDate(new Date());
  return formatLogDate(getLocalDateTime(timezone));
}

export function getWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const end = addDays(start, 4); // Friday
  return { start, end };
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getLocalDateTime(timezone: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const val: Record<string, string> = {};
    parts.forEach((p) => {
      val[p.type] = p.value;
    });
    return new Date(
      parseInt(val.year),
      parseInt(val.month) - 1,
      parseInt(val.day),
      parseInt(val.hour),
      parseInt(val.minute),
      parseInt(val.second)
    );
  } catch {
    return new Date();
  }
}
