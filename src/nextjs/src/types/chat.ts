/**
 * Chat and Agent related types
 */

export interface ChatRequest {
  user_id: string;
  message: string;
  session_id?: string | null;
  tts_enabled?: boolean;
}

export interface StreamTraceEvent {
  type: 'thought' | 'status';
  content: string;
  node?: string;
  label?: string;
  tool_name?: string;
  phase?: 'start' | 'complete';
  meta?: Record<string, unknown>;
}

export interface AgentThreadMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> & {
    traces?: StreamTraceEvent[];
  };
  traces?: StreamTraceEvent[];
}

export interface ChatResponse {
  user_id: string;
  session_id?: string | null;
  message: string;
  response: string;
  episodic_context: string;
  semantic_context: string;
  thread_context: string;
}

export interface AgentSession {
  id: string;
  user_id: string;
  title?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  metadata?: Record<string, any>;
}

export interface CreateSessionRequest {
  topics?: string[];
  config_override?: Record<string, any>;
}
