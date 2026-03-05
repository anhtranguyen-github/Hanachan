/**
 * Agent Job Repository - Supabase-mediated workflow
 * Phase 3: Communication Hardening
 * 
 * This module provides idempotent job creation and management
 * for triggering FastAPI agents through Supabase.
 */

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

export type JobType = 
  | 'fsrs_schedule'
  | 'sentence_analyze'
  | 'video_embed'
  | 'memory_consolidate'
  | 'chat_process'
  | 'reading_generate';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface AgentJob {
  id: string;
  job_type: JobType;
  job_version: number;
  idempotency_key: string;
  payload: Record<string, unknown>;
  payload_hash: string | null;
  status: JobStatus;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_attempts: number;
  max_attempts: number;
  result: Record<string, unknown> | null;
  error_message: string | null;
  error_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  first_processed_at: string | null;
  replay_count: number;
}

export interface CreateJobOptions {
  jobType: JobType;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  maxAttempts?: number;
}

export interface CreateJobResult {
  jobId: string;
  status: JobStatus;
  isDuplicate: boolean;
  existingResult: Record<string, unknown> | null;
}

/**
 * Generate an idempotency key
 * Format: userId:action:timestamp[:random]
 */
export function generateIdempotencyKey(
  userId: string,
  action: string,
  data?: Record<string, unknown>
): string {
  const timestamp = Date.now();
  const dataHash = data 
    ? btoa(JSON.stringify(data)).slice(0, 16)
    : '';
  return `${userId}:${action}:${timestamp}${dataHash ? ':' + dataHash : ''}`;
}

/**
 * Create a new agent job with idempotency
 */
export async function createAgentJob(
  userId: string,
  options: CreateJobOptions
): Promise<CreateJobResult> {
  const client = supabase;
  
  const idempotencyKey = options.idempotencyKey || generateIdempotencyKey(
    userId,
    options.jobType,
    options.payload
  );
  
  // Check for existing job within idempotency window
  const { data: existingJob } = await client
    .from('agent_jobs')
    .select('id, status, result')
    .eq('idempotency_key', idempotencyKey)
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .maybeSingle();
  
  if (existingJob) {
    return {
      jobId: existingJob.id,
      status: existingJob.status as JobStatus,
      isDuplicate: true,
      existingResult: existingJob.result as Record<string, unknown> | null,
    };
  }
  
  // Create new job
  const { data: job, error } = await client
    .from('agent_jobs')
    .insert({
      job_type: options.jobType,
      idempotency_key: idempotencyKey,
      payload: options.payload,
      created_by: userId,
      max_attempts: options.maxAttempts || 3,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating agent job:', error);
    throw new Error(`Failed to create job: ${(error instanceof Error ? error.message : String(error))}`);
  }
  
  return {
    jobId: job.id,
    status: job.status as JobStatus,
    isDuplicate: false,
    existingResult: null,
  };
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<AgentJob | null> {
  const client = supabase;
  
  const { data, error } = await client
    .from('agent_jobs')
    .select('*')
    .eq('id', jobId)
    .single();
  
  if (error) {
    console.error('Error fetching job:', error);
    return null;
  }
  
  return data as AgentJob;
}

/**
 * Get job result by idempotency key (with replay tracking)
 */
export async function getJobResultByIdempotencyKey(
  idempotencyKey: string,
  userId?: string
): Promise<{
  status: JobStatus | 'not_found';
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  isReplay: boolean;
}> {
  const client = supabase;
  
  const { data: job } = await client
    .from('agent_jobs')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();
  
  if (!job) {
    return {
      status: 'not_found',
      result: null,
      errorMessage: 'Job not found',
      isReplay: false,
    };
  }
  
  // Check if this is a replay (job already completed)
  const isReplay = job.status === 'completed' && job.first_processed_at !== null;
  
  if (isReplay) {
    // Increment replay count
    await client
      .from('agent_jobs')
      .update({ replay_count: (job.replay_count || 0) + 1 })
      .eq('id', job.id);
    
    // Log replay event
    await client.from('agent_job_events').insert({
      job_id: job.id,
      event_type: 'replayed',
      event_data: { requested_by: userId },
      created_by: userId,
    });
  }
  
  return {
    status: job.status as JobStatus,
    result: job.result as Record<string, unknown> | null,
    errorMessage: job.error_message,
    isReplay,
  };
}

/**
 * Wait for job completion with timeout
 */
export async function waitForJobCompletion(
  jobId: string,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  } = {}
): Promise<AgentJob | null> {
  const { timeoutMs = 30000, pollIntervalMs = 500 } = options;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const job = await getJob(jobId);
    
    if (!job) {
      return null;
    }
    
    if (job.status === 'completed' || job.status === 'failed') {
      return job;
    }
    
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
  
  throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
}

/**
 * List jobs for a user
 */
export async function listUserJobs(
  userId: string,
  options: {
    status?: JobStatus;
    jobType?: JobType;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ jobs: AgentJob[]; total: number }> {
  const client = supabase;
  
  let query = client
    .from('agent_jobs')
    .select('*', { count: 'exact' })
    .eq('created_by', userId)
    .order('created_at', { ascending: false });
  
  if (options.status) {
    query = query.eq('status', options.status);
  }
  
  if (options.jobType) {
    query = query.eq('job_type', options.jobType);
  }
  
  const limit = options.limit || 20;
  const offset = options.offset || 0;
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error listing jobs:', error);
    return { jobs: [], total: 0 };
  }
  
  return {
    jobs: (data || []) as AgentJob[],
    total: count || 0,
  };
}

/**
 * Cancel a pending job
 */
export async function cancelJob(
  jobId: string,
  userId: string
): Promise<boolean> {
  const client = supabase;
  
  const { error } = await client
    .from('agent_jobs')
    .update({
      status: 'cancelled',
      updated_at: HanaTime.getNowISO(),
    })
    .eq('id', jobId)
    .eq('created_by', userId)
    .eq('status', 'pending'); // Can only cancel pending jobs
  
  if (error) {
    console.error('Error cancelling job:', error);
    return false;
  }
  
  // Log cancellation event
  await client.from('agent_job_events').insert({
    job_id: jobId,
    event_type: 'cancelled',
    event_data: { cancelled_by: userId },
    created_by: userId,
  });
  
  return true;
}

/**
 * Retry a failed job
 */
export async function retryJob(
  jobId: string,
  userId: string
): Promise<boolean> {
  const client = supabase;
  
  const { error } = await client
    .from('agent_jobs')
    .update({
      status: 'pending',
      processing_started_at: null,
      processing_attempts: 0,
      error_message: null,
      error_code: null,
      updated_at: HanaTime.getNowISO(),
    })
    .eq('id', jobId)
    .eq('created_by', userId)
    .eq('status', 'failed');
  
  if (error) {
    console.error('Error retrying job:', error);
    return false;
  }
  
  // Log retry event
  await client.from('agent_job_events').insert({
    job_id: jobId,
    event_type: 'retried',
    event_data: { retried_by: userId },
    created_by: userId,
  });
  
  return true;
}
