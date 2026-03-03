-- =============================================================================
-- AGENT JOB QUEUE SYSTEM
-- Phase 3: Communication Hardening - Supabase-mediated workflow
-- 
-- This migration creates the infrastructure for agent job queuing with:
-- - Idempotency key support
-- - Replay safety mechanisms
-- - Job status tracking
-- - Event sourcing for audit trails
-- =============================================================================

-- =============================================================================
-- AGENT JOB QUEUE TABLE
-- Stores pending and completed jobs for agent processing
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job identification
    job_type VARCHAR(100) NOT NULL, -- e.g., 'fsrs_schedule', 'sentence_analyze', 'video_embed'
    job_version INTEGER NOT NULL DEFAULT 1, -- For job schema versioning
    
    -- Idempotency (replay safety)
    idempotency_key VARCHAR(255) NOT NULL UNIQUE, -- Client-generated: "userId:action:timestamp"
    idempotency_window INTERVAL NOT NULL DEFAULT '24 hours', -- How long to enforce idempotency
    
    -- Job payload
    payload JSONB NOT NULL DEFAULT '{}',
    payload_hash VARCHAR(64), -- SHA-256 hash for integrity verification
    
    -- Job status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Processing tracking
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Result storage
    result JSONB,
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Ownership and audit
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Replay safety
    first_processed_at TIMESTAMPTZ, -- When job was first successfully processed
    replay_count INTEGER NOT NULL DEFAULT 0, -- Number of times result was replayed
    
    -- Index for efficient querying
    CONSTRAINT valid_processing_times CHECK (
        (processing_completed_at IS NULL OR processing_started_at IS NULL) 
        OR processing_completed_at >= processing_started_at
    )
);

-- Indexes for agent_jobs
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON public.agent_jobs(status);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_type ON public.agent_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_created_by ON public.agent_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_idempotency_key ON public.agent_jobs(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_created_at ON public.agent_jobs(created_at);

-- Composite index for common query pattern: pending jobs by type
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status_type ON public.agent_jobs(status, job_type);

-- =============================================================================
-- AGENT JOB EVENTS TABLE (Event Sourcing)
-- Immutable log of all job state changes for audit and replay
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.agent_jobs(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(50) NOT NULL 
        CHECK (event_type IN ('created', 'started', 'completed', 'failed', 'retried', 'cancelled', 'replayed')),
    
    -- Event payload (diff or full state depending on event)
    event_data JSONB NOT NULL DEFAULT '{}',
    
    -- Idempotency for events themselves
    event_idempotency_key VARCHAR(255), -- For deduplicating events
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Source tracking (for debugging)
    source_ip INET,
    user_agent TEXT
);

-- Indexes for agent_job_events
CREATE INDEX IF NOT EXISTS idx_agent_job_events_job_id ON public.agent_job_events(job_id);
CREATE INDEX IF NOT EXISTS idx_agent_job_events_type ON public.agent_job_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_job_events_created_at ON public.agent_job_events(created_at);

-- =============================================================================
-- IDEMPOTENCY LOCK TABLE
-- Distributed lock table for preventing duplicate processing
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.idempotency_locks (
    idempotency_key VARCHAR(255) PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES public.agent_jobs(id) ON DELETE CASCADE,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    
    -- Lock result
    status VARCHAR(50) NOT NULL DEFAULT 'locked'
        CHECK (status IN ('locked', 'released', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_idempotency_locks_expires ON public.idempotency_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_locks_status ON public.idempotency_locks(status);

-- =============================================================================
-- AGENT WEBHOOK DELIVERIES TABLE
-- Tracks webhook deliveries to FastAPI agents
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.agent_jobs(id) ON DELETE CASCADE,
    
    -- Delivery details
    webhook_url TEXT NOT NULL,
    delivery_attempt INTEGER NOT NULL DEFAULT 1,
    
    -- Request/response tracking
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_headers JSONB,
    response_body TEXT,
    
    -- Timing
    request_started_at TIMESTAMPTZ,
    request_completed_at TIMESTAMPTZ,
    
    -- Result
    success BOOLEAN,
    error_message TEXT,
    
    -- Retry scheduling
    next_retry_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_job_id ON public.agent_webhook_deliveries(job_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_success ON public.agent_webhook_deliveries(success);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_next_retry ON public.agent_webhook_deliveries(next_retry_at);

-- =============================================================================
-- FUNCTIONS FOR JOB MANAGEMENT
-- =============================================================================

-- Function to create a job with idempotency check
CREATE OR REPLACE FUNCTION public.create_agent_job(
    p_job_type VARCHAR(100),
    p_idempotency_key VARCHAR(255),
    p_payload JSONB DEFAULT '{}',
    p_created_by UUID DEFAULT NULL,
    p_max_attempts INTEGER DEFAULT 3
)
RETURNS TABLE (
    job_id UUID,
    status VARCHAR(50),
    is_duplicate BOOLEAN,
    existing_result JSONB
) AS $$
DECLARE
    v_job_id UUID;
    v_existing_job RECORD;
    v_payload_hash VARCHAR(64);
BEGIN
    -- Check for existing job with same idempotency key within window
    SELECT * INTO v_existing_job
    FROM public.agent_jobs
    WHERE idempotency_key = p_idempotency_key
      AND created_at > (now() - interval '24 hours')
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_existing_job IS NOT NULL THEN
        -- Return existing job info
        RETURN QUERY SELECT 
            v_existing_job.id,
            v_existing_job.status,
            TRUE,
            v_existing_job.result;
        RETURN;
    END IF;
    
    -- Calculate payload hash for integrity
    v_payload_hash := encode(digest(p_payload::text, 'sha256'), 'hex');
    
    -- Create new job
    INSERT INTO public.agent_jobs (
        job_type,
        idempotency_key,
        payload,
        payload_hash,
        created_by,
        max_attempts
    ) VALUES (
        p_job_type,
        p_idempotency_key,
        p_payload,
        v_payload_hash,
        p_created_by,
        p_max_attempts
    )
    RETURNING id INTO v_job_id;
    
    -- Log the creation event
    INSERT INTO public.agent_job_events (
        job_id,
        event_type,
        event_data,
        created_by
    ) VALUES (
        v_job_id,
        'created',
        jsonb_build_object('payload', p_payload),
        p_created_by
    );
    
    -- Create idempotency lock
    INSERT INTO public.idempotency_locks (
        idempotency_key,
        job_id,
        locked_by
    ) VALUES (
        p_idempotency_key,
        v_job_id,
        p_created_by
    );
    
    RETURN QUERY SELECT v_job_id, 'pending'::VARCHAR(50), FALSE, NULL::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim a pending job for processing
CREATE OR REPLACE FUNCTION public.claim_agent_job(
    p_job_types VARCHAR(100)[] DEFAULT NULL,
    p_worker_id UUID DEFAULT NULL
)
RETURNS TABLE (
    job_id UUID,
    job_type VARCHAR(100),
    payload JSONB,
    attempts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH claimed AS (
        SELECT aj.id
        FROM public.agent_jobs aj
        WHERE aj.status = 'pending'
          AND aj.processing_attempts < aj.max_attempts
          AND (p_job_types IS NULL OR aj.job_type = ANY(p_job_types))
        ORDER BY aj.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    UPDATE public.agent_jobs aj
    SET 
        status = 'processing',
        processing_started_at = now(),
        processing_attempts = processing_attempts + 1,
        updated_at = now()
    FROM claimed
    WHERE aj.id = claimed.id
    RETURNING aj.id, aj.job_type, aj.payload, aj.processing_attempts;
    
    -- Log the start event if a job was claimed
    IF FOUND THEN
        INSERT INTO public.agent_job_events (job_id, event_type, event_data)
        VALUES (claimed.id, 'started', jsonb_build_object('worker_id', p_worker_id));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a job
CREATE OR REPLACE FUNCTION public.complete_agent_job(
    p_job_id UUID,
    p_result JSONB DEFAULT NULL,
    p_worker_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.agent_jobs
    SET 
        status = 'completed',
        result = p_result,
        processing_completed_at = now(),
        first_processed_at = COALESCE(first_processed_at, now()),
        updated_at = now()
    WHERE id = p_job_id;
    
    INSERT INTO public.agent_job_events (job_id, event_type, event_data, created_by)
    VALUES (p_job_id, 'completed', jsonb_build_object('result', p_result), p_worker_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark a job as failed
CREATE OR REPLACE FUNCTION public.fail_agent_job(
    p_job_id UUID,
    p_error_message TEXT,
    p_error_code VARCHAR(100) DEFAULT NULL,
    p_retryable BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
DECLARE
    v_attempts INTEGER;
    v_max_attempts INTEGER;
BEGIN
    -- Get current attempts
    SELECT processing_attempts, max_attempts 
    INTO v_attempts, v_max_attempts
    FROM public.agent_jobs WHERE id = p_job_id;
    
    -- If max attempts reached or not retryable, mark as failed
    IF v_attempts >= v_max_attempts OR NOT p_retryable THEN
        UPDATE public.agent_jobs
        SET 
            status = 'failed',
            error_message = p_error_message,
            error_code = p_error_code,
            processing_completed_at = now(),
            updated_at = now()
        WHERE id = p_job_id;
        
        INSERT INTO public.agent_job_events (job_id, event_type, event_data)
        VALUES (p_job_id, 'failed', jsonb_build_object(
            'error_message', p_error_message,
            'error_code', p_error_code,
            'final', true
        ));
    ELSE
        -- Reset to pending for retry
        UPDATE public.agent_jobs
        SET 
            status = 'pending',
            error_message = p_error_message,
            error_code = p_error_code,
            processing_started_at = NULL,
            updated_at = now()
        WHERE id = p_job_id;
        
        INSERT INTO public.agent_job_events (job_id, event_type, event_data)
        VALUES (p_job_id, 'retried', jsonb_build_object(
            'error_message', p_error_message,
            'error_code', p_error_code,
            'attempt', v_attempts
        ));
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job result with replay tracking
CREATE OR REPLACE FUNCTION public.get_agent_job_result(
    p_idempotency_key VARCHAR(255),
    p_requester_id UUID DEFAULT NULL
)
RETURNS TABLE (
    status VARCHAR(50),
    result JSONB,
    error_message TEXT,
    is_replay BOOLEAN
) AS $$
DECLARE
    v_job_id UUID;
BEGIN
    -- Get the job
    SELECT id INTO v_job_id
    FROM public.agent_jobs
    WHERE idempotency_key = p_idempotency_key;
    
    IF v_job_id IS NULL THEN
        RETURN QUERY SELECT 'not_found'::VARCHAR(50), NULL::JSONB, 'Job not found'::TEXT, FALSE;
        RETURN;
    END IF;
    
    -- Check if this is a replay (job already completed)
    IF EXISTS (
        SELECT 1 FROM public.agent_jobs 
        WHERE id = v_job_id AND status = 'completed' AND first_processed_at IS NOT NULL
    ) THEN
        -- Increment replay count
        UPDATE public.agent_jobs
        SET replay_count = replay_count + 1
        WHERE id = v_job_id;
        
        -- Log replay event
        INSERT INTO public.agent_job_events (job_id, event_type, event_data, created_by)
        VALUES (v_job_id, 'replayed', jsonb_build_object('requested_by', p_requester_id), p_requester_id);
        
        RETURN QUERY SELECT 
            aj.status,
            aj.result,
            aj.error_message,
            TRUE
        FROM public.agent_jobs aj
        WHERE aj.id = v_job_id;
    ELSE
        RETURN QUERY SELECT 
            aj.status,
            aj.result,
            aj.error_message,
            FALSE
        FROM public.agent_jobs aj
        WHERE aj.id = v_job_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old jobs and locks
CREATE OR REPLACE FUNCTION public.cleanup_agent_jobs(
    p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    -- Delete old completed/failed jobs
    DELETE FROM public.agent_jobs
    WHERE status IN ('completed', 'failed', 'cancelled')
      AND created_at < (now() - (p_retention_days || ' days')::interval);
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    
    -- Clean up expired locks
    DELETE FROM public.idempotency_locks
    WHERE expires_at < now() OR status = 'released';
    
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_job_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Users can see their own jobs
CREATE POLICY agent_jobs_select_own ON public.agent_jobs
    FOR SELECT USING (created_by = auth.uid());

-- Users can create their own jobs
CREATE POLICY agent_jobs_insert_own ON public.agent_jobs
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Only service role can update/delete
CREATE POLICY agent_jobs_service_update ON public.agent_jobs
    FOR UPDATE USING (false);

-- Events are viewable by job owner
CREATE POLICY agent_job_events_select_own ON public.agent_job_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agent_jobs aj 
            WHERE aj.id = job_id AND aj.created_by = auth.uid()
        )
    );

-- Webhook deliveries viewable by job owner
CREATE POLICY webhook_deliveries_select_own ON public.agent_webhook_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agent_jobs aj 
            WHERE aj.id = job_id AND aj.created_by = auth.uid()
        )
    );

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_jobs_updated_at
    BEFORE UPDATE ON public.agent_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.agent_jobs IS 'Queue for agent jobs with idempotency and replay safety';
COMMENT ON TABLE public.agent_job_events IS 'Event sourcing log for agent job state changes';
COMMENT ON TABLE public.idempotency_locks IS 'Distributed locks for idempotency enforcement';
COMMENT ON TABLE public.agent_webhook_deliveries IS 'Tracking table for webhook deliveries to agents';

COMMENT ON COLUMN public.agent_jobs.idempotency_key IS 'Client-generated key for idempotent job creation (format: userId:action:timestamp)';
COMMENT ON COLUMN public.agent_jobs.first_processed_at IS 'Timestamp when job was first successfully processed (for replay detection)';
COMMENT ON COLUMN public.agent_jobs.replay_count IS 'Number of times the result has been replayed';
