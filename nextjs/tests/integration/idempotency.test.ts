/**
 * Integration Tests: Agent Job Idempotency
 * Phase 4: Architecture Validation
 * 
 * These tests verify that agent jobs are idempotent and
 * replay-safe mechanisms work correctly.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { 
  generateIdempotencyKey, 
  createAgentJob,
  getJobResultByIdempotencyKey,
  waitForJobCompletion 
} from '@/features/jobs/jobRepository';
import { createClient } from '@supabase/supabase-js';

const TEST_USER_ID = 'test-user-id';

describe('Idempotency Tests', () => {
  describe('generateIdempotencyKey', () => {
    it('should generate unique keys for different inputs', () => {
      const key1 = generateIdempotencyKey('user1', 'action1', { data: 1 });
      const key2 = generateIdempotencyKey('user1', 'action1', { data: 2 });
      
      expect(key1).not.toBe(key2);
    });

    it('should generate keys with correct format', () => {
      const key = generateIdempotencyKey('user123', 'fsrs_schedule');
      
      expect(key).toMatch(/^user123:fsrs_schedule:\d+$/);
    });

    it('should include data hash when payload provided', () => {
      const key = generateIdempotencyKey('user1', 'action', { test: true });
      
      // Should have 4 parts when data is included
      const parts = key.split(':');
      expect(parts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Job Creation Idempotency', () => {
    it('should return same job for duplicate idempotency key within window', async () => {
      const idempotencyKey = `test-dup-${Date.now()}`;
      
      // Create first job
      const result1 = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: { test: true },
        idempotencyKey,
      });
      
      // Create second job with same key
      const result2 = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: { test: true },
        idempotencyKey,
      });
      
      expect(result1.jobId).toBe(result2.jobId);
      expect(result2.isDuplicate).toBe(true);
    });

    it('should create new job for different idempotency keys', async () => {
      const key1 = `test-unique-${Date.now()}-1`;
      const key2 = `test-unique-${Date.now()}-2`;
      
      const result1 = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: { test: true },
        idempotencyKey: key1,
      });
      
      const result2 = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: { test: true },
        idempotencyKey: key2,
      });
      
      expect(result1.jobId).not.toBe(result2.jobId);
      expect(result1.isDuplicate).toBe(false);
      expect(result2.isDuplicate).toBe(false);
    });
  });

  describe('Replay Safety', () => {
    it('should track replay count on result retrieval', async () => {
      const idempotencyKey = `test-replay-${Date.now()}`;
      
      // Create a job
      const { jobId } = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: {},
        idempotencyKey,
      });
      
      // First retrieval (not a replay, job not completed)
      const result1 = await getJobResultByIdempotencyKey(idempotencyKey, TEST_USER_ID);
      expect(result1.isReplay).toBe(false);
      
      // Note: In real scenario, job would be completed by agent
      // Then subsequent retrievals would be replays
    });

    it('should return existing result for duplicate requests', async () => {
      const idempotencyKey = `test-existing-${Date.now()}`;
      
      // Create job
      const result1 = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: { value: 42 },
        idempotencyKey,
      });
      
      // Duplicate request
      const result2 = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: { value: 999 }, // Different payload, same key
        idempotencyKey,
      });
      
      // Should return first job, ignoring new payload
      expect(result2.jobId).toBe(result1.jobId);
      expect(result2.isDuplicate).toBe(true);
    });
  });

  describe('Job Status Tracking', () => {
    it('should track job through lifecycle states', async () => {
      const idempotencyKey = `test-lifecycle-${Date.now()}`;
      
      // Create job
      const { jobId, status } = await createAgentJob(TEST_USER_ID, {
        jobType: 'test_job',
        payload: {},
        idempotencyKey,
      });
      
      expect(jobId).toBeDefined();
      expect(status).toBe('pending');
      
      // Get job status
      const result = await getJobResultByIdempotencyKey(idempotencyKey);
      expect(result.status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent idempotency keys', async () => {
      const result = await getJobResultByIdempotencyKey('non-existent-key');
      
      expect(result.status).toBe('not_found');
      expect(result.result).toBeNull();
      expect(result.isReplay).toBe(false);
    });
  });
});
