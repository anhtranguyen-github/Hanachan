import { AGENTS_BASE_URL } from './env';

/**
 * Base URLs for internal and external services
 */

// backend port 43110
export const AGENTS_API_BASE_URL = AGENTS_BASE_URL;

export const BACKEND_API_BASE_URL =
  process.env.FASTAPI_CORE_URL?.replace(/\/+$/, '') ||
  `${AGENTS_BASE_URL}/api/v1`;

export const WANIKANI_API_V2_BASE_URL = `${AGENTS_BASE_URL}/api/v2`;

/**
 * API Endpoints
 */
export const ENDPOINTS = {
  CHAT: {
    SEND: '/chat',
    STREAM: '/chat/stream',
  },
  MEMORY: {
    SESSION: '/memory/session',
    SESSIONS: '/memory/sessions',
    CONTEXT: '/memory/context',
    EPISODIC: '/memory/episodic',
  },
  CORE: {
    REVIEW: '/sessions/review',
    LESSON: '/sessions/lesson',
    LEARNING: '/learning',
    READING: '/reading',
  }
};
