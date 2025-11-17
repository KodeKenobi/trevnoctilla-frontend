-- Create all tables in Supabase
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_login TIMESTAMP,
    subscription_tier VARCHAR(20) DEFAULT 'free' NOT NULL,
    monthly_call_limit INTEGER DEFAULT 5 NOT NULL,
    monthly_used INTEGER DEFAULT 0 NOT NULL,
    monthly_reset_date TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    rate_limit INTEGER DEFAULT 1000 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_used TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);

-- Usage Logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    file_size BIGINT,
    processing_time FLOAT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs(timestamp);

-- Rate Limits table
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
    requests_count INTEGER DEFAULT 0 NOT NULL,
    window_start TIMESTAMP DEFAULT NOW() NOT NULL,
    window_duration INTEGER DEFAULT 3600 NOT NULL
);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(64) UNIQUE NOT NULL,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint VARCHAR(200) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    input_file_path VARCHAR(500),
    output_file_path VARCHAR(500),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_time FLOAT
);

CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    api_key_id INTEGER REFERENCES api_keys(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    events JSONB,
    secret VARCHAR(64),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    last_triggered TIMESTAMP,
    failure_count INTEGER DEFAULT 0 NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhooks_api_key_id ON webhooks(api_key_id);

-- Reset History table
CREATE TABLE IF NOT EXISTS reset_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reset_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    calls_before INTEGER NOT NULL,
    calls_after INTEGER DEFAULT 0 NOT NULL,
    reset_reason VARCHAR(500),
    reset_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reset_history_user_id ON reset_history(user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' NOT NULL,
    category VARCHAR(50) DEFAULT 'system' NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    read_at TIMESTAMP,
    read_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notification_metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Analytics Events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    session_id VARCHAR(100) NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    user_agent TEXT,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    referrer TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Page Views table
CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
    duration INTEGER,
    referrer TEXT,
    user_agent TEXT,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);

-- User Sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    start_time TIMESTAMP NOT NULL,
    last_activity TIMESTAMP NOT NULL,
    page_views INTEGER DEFAULT 0,
    events INTEGER DEFAULT 0,
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(50),
    city VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions(start_time);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ All tables created successfully in Supabase!';
END $$;

