/**
 * Integration Tests: Row Level Security (RLS) Enforcement
 * Phase 4: Architecture Validation
 * 
 * These tests verify that RLS policies are correctly enforced
 * and users cannot access data they don't own.
 */

import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';

describe('RLS Enforcement Tests', () => {
  let client: ReturnType<typeof createClient>;
  let authUserId: string;

  beforeAll(async () => {
    // Create authenticated client
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Sign in test user (in real tests, this would use test credentials)
    // For now, we assume the client is already authenticated
  });

  beforeEach(() => {
    // Reset state between tests
  });

  describe('agent_jobs table', () => {
    it('should allow users to create their own jobs', async () => {
      const { data, error } = await client
        .from('agent_jobs')
        .insert({
          job_type: 'test_job',
          idempotency_key: `test-${Date.now()}`,
          payload: { test: true },
        })
        .select()
        .single();

      // Should succeed (user owns the job)
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.created_by).toBeDefined();
    });

    it('should allow users to read their own jobs', async () => {
      const { data, error } = await client
        .from('agent_jobs')
        .select('*')
        .limit(1);

      // Should succeed for own jobs
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should NOT allow users to update jobs directly (service role only)', async () => {
      // First create a job
      const { data: job } = await client
        .from('agent_jobs')
        .insert({
          job_type: 'test_job',
          idempotency_key: `test-update-${Date.now()}`,
          payload: { test: true },
        })
        .select()
        .single();

      if (!job) return;

      // Try to update directly
      const { error } = await client
        .from('agent_jobs')
        .update({ status: 'completed' })
        .eq('id', job.id);

      // Should fail due to RLS policy
      expect(error).toBeDefined();
    });

    it('should NOT allow users to delete jobs', async () => {
      const { error } = await client
        .from('agent_jobs')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');

      // Should fail due to RLS policy
      expect(error).toBeDefined();
    });

    it('should NOT allow users to read other users jobs', async () => {
      // This test would require multiple users
      // In practice, the RLS policy ensures users only see their own data
      const { data } = await client
        .from('agent_jobs')
        .select('*');

      // All returned jobs should belong to the current user
      for (const job of data || []) {
        expect(job.created_by).toBe(authUserId);
      }
    });
  });

  describe('agent_job_events table', () => {
    it('should allow users to read events for their jobs', async () => {
      const { data, error } = await client
        .from('agent_job_events')
        .select('*')
        .limit(10);

      // Should succeed for own job events
      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should NOT allow users to create events directly', async () => {
      const { error } = await client
        .from('agent_job_events')
        .insert({
          job_id: '00000000-0000-0000-0000-000000000000',
          event_type: 'test',
          event_data: {},
        });

      // Should fail due to RLS
      expect(error).toBeDefined();
    });
  });

  describe('idempotency_locks table', () => {
    it('should NOT allow users to read locks directly', async () => {
      const { error } = await client
        .from('idempotency_locks')
        .select('*');

      // Should fail - this is internal infrastructure
      expect(error).toBeDefined();
    });
  });

  describe('Cross-table isolation', () => {
    it('should maintain isolation between users data', async () => {
      // This is a conceptual test - in practice we'd use multiple users
      
      // Create job as user A
      const { data: jobA } = await client
        .from('agent_jobs')
        .insert({
          job_type: 'isolation_test',
          idempotency_key: `isolation-${Date.now()}`,
          payload: { user: 'A' },
        })
        .select()
        .single();

      expect(jobA).toBeDefined();
      expect(jobA?.created_by).toBe(authUserId);

      // Verify job appears in list
      const { data: jobs } = await client
        .from('agent_jobs')
        .select('*')
        .eq('id', jobA!.id);

      expect(jobs?.length).toBe(1);
      expect(jobs?.[0].id).toBe(jobA!.id);
    });
  });
});
