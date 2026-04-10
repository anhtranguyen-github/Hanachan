/**
 * Agent Jobs Feature
 * Phase 3: Supabase-mediated workflow for agent triggering
 */

export {
  // Core functions
  generateIdempotencyKey,
  createAgentJob,
  getJob,
  getJobResultByIdempotencyKey,
  waitForJobCompletion,
  listUserJobs,
  cancelJob,
  retryJob,
  
  // Types
  type JobType,
  type JobStatus,
  type AgentJob,
  type CreateJobOptions,
  type CreateJobResult,
} from './jobRepository';
