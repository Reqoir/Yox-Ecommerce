/**
 * @file logger.ts
 * @layer Shared
 *
 * Pino logger singleton.
 * - Development: pretty-printed, colorised output
 * - Production: JSON output (structured, machine-readable)
 *
 * Usage: import { logger } from '@shared/logger/logger';
 */

import pino from 'pino';

const isDev = process.env['NODE_ENV'] !== 'production';

export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',

  // ── Pretty print in development ──────────────────────────────────────────
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '[{context}] {msg}',
        errorLikeObjectKeys: ['err', 'error'],
      },
    },
  }),

  // ── JSON in production ────────────────────────────────────────────────────
  ...(!isDev && {
    formatters: {
      level(label: string) {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      // Redact sensitive fields from logs
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.token',
        '*.secret',
        '*.creditCard',
      ],
      censor: '[REDACTED]',
    },
  }),
});

/**
 * Create a child logger with a module/context label.
 * Usage: const log = createLogger('AuthService');
 */
export const createLogger = (context: string): pino.Logger => {
  return logger.child({ context });
};
