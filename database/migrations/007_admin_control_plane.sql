-- ==========================================================
-- MIGRATION 007: Admin Control Plane
-- Purpose: Core tables for admin dashboard, audit logging,
--          cost tracking, and abuse detection
-- ==========================================================

-- ==========================================
-- ADMIN DOMAIN
-- ==========================================

-- Admin roles table - extends auth.users with admin capabilities
CREATE TABLE IF NOT EXISTS public.admin_roles (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'moderator' CHECK (role IN ('super_admin', 'admin', 'moderator', 'viewer')),
    permissions text[] NOT NULL DEFAULT '{}',
    granted_by uuid REFERENCES public.users(id),
    granted_at timestamp with time zone DEFAULT now(),
    revoked_at timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_role ON public.admin_roles(role);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(is_active);

-- Admin action audit log - every admin action is tracked
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_user_id uuid NOT NULL REFERENCES public.users(id),
    action text NOT NULL, -- e.g., 'user_suspend', 'rate_limit_override', 'config_change'
    target_type text NOT NULL, -- e.g., 'user', 'system', 'config'
    target_id text, -- UUID or identifier of the target
    old_value jsonb,
    new_value jsonb,
    reason text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON public.admin_audit_logs(created_at DESC);

-- ==========================================
-- COST TRACKING DOMAIN
-- ==========================================

-- LLM usage tracking - per user per request
CREATE TABLE IF NOT EXISTS public.llm_usage_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    session_id uuid REFERENCES public.chat_sessions(id),
    model text NOT NULL, -- e.g., 'gpt-4o', 'gpt-4o-mini'
    endpoint text NOT NULL, -- e.g., 'chat', 'consolidation', 'sentence_annotation'
    prompt_tokens integer NOT NULL DEFAULT 0,
    completion_tokens integer NOT NULL DEFAULT 0,
    total_tokens integer NOT NULL DEFAULT 0,
    estimated_cost_usd decimal(10, 6) NOT NULL DEFAULT 0, -- Estimated cost in USD
    latency_ms integer, -- Response time in milliseconds
    success boolean NOT NULL DEFAULT true,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_user ON public.llm_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_usage_model ON public.llm_usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_llm_usage_endpoint ON public.llm_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_llm_usage_created ON public.llm_usage_logs(created_at DESC);

-- Daily cost aggregation for fast reporting
CREATE TABLE IF NOT EXISTS public.daily_cost_stats (
    date date NOT NULL PRIMARY KEY,
    total_requests integer NOT NULL DEFAULT 0,
    total_tokens integer NOT NULL DEFAULT 0,
    total_cost_usd decimal(10, 6) NOT NULL DEFAULT 0,
    by_model jsonb NOT NULL DEFAULT '{}', -- {"gpt-4o": {"requests": 100, "cost": 1.23}}
    by_endpoint jsonb NOT NULL DEFAULT '{}', -- {"chat": {"requests": 50, "cost": 0.60}}
    unique_users integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- RATE LIMITING & ABUSE DETECTION
-- ==========================================

-- Rate limit overrides - admin can temporarily adjust limits
CREATE TABLE IF NOT EXISTS public.rate_limit_overrides (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    ip_address inet,
    scope text NOT NULL CHECK (scope IN ('user', 'ip', 'global')),
    endpoint_pattern text NOT NULL DEFAULT '*', -- e.g., 'chat', '*', 'memory/*'
    max_requests_per_minute integer,
    max_requests_per_hour integer,
    max_requests_per_day integer,
    expires_at timestamp with time zone NOT NULL,
    reason text NOT NULL,
    created_by uuid NOT NULL REFERENCES public.users(id),
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user ON public.rate_limit_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON public.rate_limit_overrides(expires_at);

-- Abuse detection alerts
CREATE TABLE IF NOT EXISTS public.abuse_alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type text NOT NULL CHECK (alert_type IN ('rate_limit_exceeded', 'cost_spike', 'suspicious_pattern', 'data_exfiltration', 'spam')),
    severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id uuid REFERENCES public.users(id),
    ip_address inet,
    description text NOT NULL,
    evidence jsonb, -- Supporting data for the alert
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
    resolved_by uuid REFERENCES public.users(id),
    resolved_at timestamp with time zone,
    resolution_notes text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_abuse_user ON public.abuse_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_abuse_type ON public.abuse_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_abuse_severity ON public.abuse_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_abuse_status ON public.abuse_alerts(status);
CREATE INDEX IF NOT EXISTS idx_abuse_created ON public.abuse_alerts(created_at DESC);

-- User suspension tracking
CREATE TABLE IF NOT EXISTS public.user_suspensions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id),
    suspended_by uuid NOT NULL REFERENCES public.users(id),
    reason text NOT NULL,
    suspension_type text NOT NULL DEFAULT 'temporary' CHECK (suspension_type IN ('temporary', 'permanent')),
    suspended_until timestamp with time zone,
    is_active boolean NOT NULL DEFAULT true,
    lifted_by uuid REFERENCES public.users(id),
    lifted_at timestamp with time zone,
    lift_reason text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspensions_user ON public.user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_suspensions_active ON public.user_suspensions(is_active);

-- ==========================================
-- SYSTEM HEALTH & MONITORING
-- ==========================================

-- System health snapshots - for historical tracking
CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    db_status text NOT NULL,
    qdrant_status text NOT NULL,
    neo4j_status text NOT NULL,
    response_time_ms integer,
    active_users_1h integer DEFAULT 0,
    active_users_24h integer DEFAULT 0,
    error_rate_1h decimal(5, 4) DEFAULT 0, -- Error rate in the last hour
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_created ON public.system_health_snapshots(created_at DESC);

-- ==========================================
-- AI DEBUGGING & TRACING
-- ==========================================

-- Agent execution traces - for debugging AI behavior
CREATE TABLE IF NOT EXISTS public.agent_traces (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id),
    session_id uuid REFERENCES public.chat_sessions(id),
    agent_name text NOT NULL, -- e.g., 'memory_agent', 'reading_creator', 'fsrs_agent'
    trace_type text NOT NULL CHECK (trace_type IN ('input', 'output', 'tool_call', 'error', 'intermediate')),
    step_number integer NOT NULL,
    input_data jsonb,
    output_data jsonb,
    latency_ms integer,
    model text,
    tokens_used integer,
    error_message text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_traces_user ON public.agent_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_session ON public.agent_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_agent ON public.agent_traces(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_traces_created ON public.agent_traces(created_at DESC);

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_cost_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abuse_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;

-- Admin roles: Only admins can view admin roles
CREATE POLICY admin_roles_policy ON public.admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- Admin audit logs: Admins can view all, users can only see their own actions as targets
CREATE POLICY admin_audit_logs_policy ON public.admin_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- LLM usage logs: Admins can view all, users can view their own
CREATE POLICY llm_usage_logs_policy ON public.llm_usage_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- Daily cost stats: Admins only
CREATE POLICY daily_cost_stats_policy ON public.daily_cost_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- Rate limit overrides: Admins only
CREATE POLICY rate_limit_overrides_policy ON public.rate_limit_overrides
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- Abuse alerts: Admins only
CREATE POLICY abuse_alerts_policy ON public.abuse_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- User suspensions: Admins only
CREATE POLICY user_suspensions_policy ON public.user_suspensions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- System health snapshots: Admins only
CREATE POLICY system_health_snapshots_policy ON public.system_health_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- Agent traces: Admins can view all, users can view their own
CREATE POLICY agent_traces_policy ON public.agent_traces
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_roles ar
            WHERE ar.user_id = auth.uid() AND ar.is_active = true
        )
    );

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_roles
        WHERE user_id = user_uuid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check admin permission level
CREATE OR REPLACE FUNCTION public.has_admin_permission(user_uuid uuid, required_role text)
RETURNS boolean AS $$
DECLARE
    user_role text;
    role_hierarchy text[] := ARRAY['viewer', 'moderator', 'admin', 'super_admin'];
    user_level int;
    required_level int;
BEGIN
    SELECT role INTO user_role FROM public.admin_roles
    WHERE user_id = user_uuid AND is_active = true;
    
    IF user_role IS NULL THEN
        RETURN false;
    END IF;
    
    SELECT array_position(role_hierarchy, user_role) INTO user_level;
    SELECT array_position(role_hierarchy, required_role) INTO required_level;
    
    RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON public.admin_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_cost_stats_updated_at
    BEFORE UPDATE ON public.daily_cost_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
