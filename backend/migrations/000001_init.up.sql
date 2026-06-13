CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE auth_provider AS ENUM ('email', 'google', 'both');
CREATE TYPE summary_type AS ENUM ('daily', 'weekly');
CREATE TYPE email_type AS ENUM ('daily', 'weekly', 'nudge', 'verification', 'monday');
CREATE TYPE email_status AS ENUM ('sent', 'failed', 'skipped', 'bounced');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255),
    auth_provider auth_provider NOT NULL DEFAULT 'email',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    email_verified BOOLEAN NOT NULL DEFAULT false,
    is_password_set BOOLEAN NOT NULL DEFAULT false,
    daily_email_enabled BOOLEAN NOT NULL DEFAULT true,
    weekly_email_enabled BOOLEAN NOT NULL DEFAULT true,
    nudge_email_enabled BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    log_date DATE NOT NULL,
    is_edited_after_generation BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    summary_type summary_type NOT NULL,
    raw_logs TEXT NOT NULL,
    generated_summary TEXT NOT NULL,
    regeneration_count INT NOT NULL DEFAULT 0,
    is_fallback BOOLEAN NOT NULL DEFAULT false,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(500),
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_type email_type NOT NULL,
    status email_status NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX idx_logs_user_date ON logs(user_id, log_date);
CREATE INDEX idx_summaries_user_date ON summaries(user_id, log_date);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
