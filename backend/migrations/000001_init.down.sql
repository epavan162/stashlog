DROP INDEX IF EXISTS idx_sessions_token;
DROP INDEX IF EXISTS idx_sessions_user;
DROP INDEX IF EXISTS idx_summaries_user_date;
DROP INDEX IF EXISTS idx_logs_user_date;

DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS summaries;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS email_status;
DROP TYPE IF EXISTS email_type;
DROP TYPE IF EXISTS summary_type;
DROP TYPE IF EXISTS auth_provider;

DROP EXTENSION IF EXISTS "uuid-ossp";
