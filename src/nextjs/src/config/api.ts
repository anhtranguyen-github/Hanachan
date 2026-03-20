import { AGENTS_BASE_URL } from './env';

/**
 * Base URLs for internal and external services
 */

// backend port 6100
export const AGENTS_API_BASE_URL = AGENTS_BASE_URL;

// unified backend port 6100
export const BACKEND_API_BASE_URL =
  process.env.FASTAPI_CORE_URL?.replace(/\/+$/, '') ||
  `${AGENTS_BASE_URL}/api/v1`;

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
