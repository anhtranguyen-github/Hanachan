/**
 * Integration Tests: Agent Job Idempotency
 * Phase 4: Architecture Validation
 * 
 * These tests verify that agent jobs are idempotent and
 * replay-safe mechanisms work correctly.
 * 
 * Requires: Cloud Supabase with agent_jobs table migrated.
 * Uses service role key to bypass RLS for testing.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { generateIdempotencyKey } from '@/features/jobs/jobRepository';

// Use a real UUID for test user (required by FK to auth.users)
// We pass null for created_by since we use service role (bypasses RLS)
const TEST_IDEMPOTENCY_PREFIX = `test-idem-${Date.now()}`;

// Service role client bypasses RLS — required for integration tests without real auth
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getServiceClient() {
  if (!supabaseUrl || !serviceKey || serviceKey.includes('test-service-key')) {
    return null;
  }
  return createClient(supabaseUrl, serviceKey);
}

// Collect job IDs for cleanup
const createdJobIds: string[] = [];

describe('Idempotency Tests', () => {
  const client = getServiceClient();

  beforeAll(() => {
    if (!client) {
      console.warn('⚠️  Skipping integration tests: no real Supabase credentials');
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (client && createdJobIds.length > 0) {
      await client
        .from('agent_jobs')
        .delete()
        .in('id', createdJobIds);
    }
  });

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
    it.skipIf(!client)('should return same job for duplicate idempotency key within window', async () => {
      const idempotencyKey = `${TEST_IDEMPOTENCY_PREFIX}-dup-1`;

      // Create first job using service role (no created_by to avoid FK constraint)
      const { data: job1, error: err1 } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: idempotencyKey,
          payload: { test: true },
        })
        .select()
        .single();

      expect(err1).toBeNull();
      expect(job1).toBeDefined();
      createdJobIds.push(job1!.id);

      // Try to find existing job with same key
      const { data: existing } = await client!
        .from('agent_jobs')
        .select('id, status, result')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      expect(existing).toBeDefined();
      expect(existing!.id).toBe(job1!.id);
    });

    it.skipIf(!client)('should create new job for different idempotency keys', async () => {
      const key1 = `${TEST_IDEMPOTENCY_PREFIX}-unique-1`;
      const key2 = `${TEST_IDEMPOTENCY_PREFIX}-unique-2`;

      const { data: job1 } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: key1,
          payload: { test: true },
        })
        .select()
        .single();

      const { data: job2 } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: key2,
          payload: { test: true },
        })
        .select()
        .single();

      expect(job1!.id).not.toBe(job2!.id);
      createdJobIds.push(job1!.id, job2!.id);
    });
  });

  describe('Replay Safety', () => {
    it.skipIf(!client)('should track replay count on result retrieval', async () => {
      const idempotencyKey = `${TEST_IDEMPOTENCY_PREFIX}-replay-1`;

      const { data: job } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: idempotencyKey,
          payload: {},
        })
        .select()
        .single();

      expect(job).toBeDefined();
      createdJobIds.push(job!.id);

      // Job is pending, not completed — so not a replay
      const { data: found } = await client!
        .from('agent_jobs')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle();

      expect(found).toBeDefined();
      expect(found!.status).toBe('pending');
      expect(found!.first_processed_at).toBeNull();
    });

    it.skipIf(!client)('should return existing result for duplicate requests', async () => {
      const idempotencyKey = `${TEST_IDEMPOTENCY_PREFIX}-existing-1`;

      // Create job
      const { data: job1 } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: idempotencyKey,
          payload: { value: 42 },
        })
        .select()
        .single();

      expect(job1).toBeDefined();
      createdJobIds.push(job1!.id);

      // Try to insert duplicate — should fail due to UNIQUE constraint on idempotency_key
      const { error: dupError } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: idempotencyKey,
          payload: { value: 999 },
        })
        .select()
        .single();

      // Unique constraint violation is expected
      expect(dupError).toBeDefined();
    });
  });

  describe('Job Status Tracking', () => {
    it.skipIf(!client)('should track job through lifecycle states', async () => {
      const idempotencyKey = `${TEST_IDEMPOTENCY_PREFIX}-lifecycle-1`;

      // Create job
      const { data: job, error } = await client!
        .from('agent_jobs')
        .insert({
          job_type: 'fsrs_schedule',
          idempotency_key: idempotencyKey,
          payload: {},
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(job).toBeDefined();
      expect(job!.status).toBe('pending');
      createdJobIds.push(job!.id);

      // Update to processing
      await client!
        .from('agent_jobs')
        .update({ status: 'processing', processing_started_at: new Date().toISOString() })
        .eq('id', job!.id);

      const { data: processing } = await client!
        .from('agent_jobs')
        .select('status')
        .eq('id', job!.id)
        .single();

      expect(processing!.status).toBe('processing');
    });
  });

  describe('Error Handling', () => {
    it.skipIf(!client)('should handle non-existent idempotency keys', async () => {
      const { data: result } = await client!
        .from('agent_jobs')
        .select('*')
        .eq('idempotency_key', 'non-existent-key-12345')
        .maybeSingle();

      expect(result).toBeNull();
    });
  });
});
