export interface User {
  id: string;
  name: string;
  email: string;
  auth_provider: 'email' | 'google' | 'both';
  timezone: string;
  email_verified: boolean;
  is_password_set: boolean;
  daily_email_enabled: boolean;
  weekly_email_enabled: boolean;
  nudge_email_enabled: boolean;
  created_at: string;
}

export interface Log {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  log_date: string;
  is_edited_after_generation: boolean;
  created_at: string;
  updated_at: string;
}

export interface Summary {
  id: string;
  user_id: string;
  log_date: string;
  summary_type: 'daily' | 'weekly';
  raw_logs: string;
  generated_summary: string;
  regeneration_count: number;
  is_fallback: boolean;
  generated_at: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
}

export interface Streak {
  current_streak: number;
  best_streak: number;
  week_status: WeekDay[];
  weekend_bonus: boolean;
  saturday_logged: boolean;
  sunday_logged: boolean;
}

export interface WeekDay {
  date: string;
  day: string;
  logged: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface LogsResponse {
  logs: Log[];
  date?: string;
  is_locked?: boolean;
}

export interface SummaryResponse {
  summary: Summary;
}

export interface SummariesResponse {
  summaries: Summary[];
}

export interface UserMeResponse {
  user: User;
  streak: Streak;
}

export interface SessionsResponse {
  sessions: Session[];
}

export type TagType = 'bug' | 'feature' | 'review' | 'blocked' | 'learning';
