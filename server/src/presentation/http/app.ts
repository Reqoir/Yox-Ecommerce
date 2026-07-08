/**
 * @file app.ts
 * @layer Presentation › HTTP
 *
 * Express application factory.
 * Configures all middleware — no routes here except the root router.
 * Routes are mounted in server.ts after DB connections are established.
 */

import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { env } from '../../core/infrastructure/config/env';
import { rootRouter } from './routes/index';
import { notFoundHandler } from './middleware/not-found.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { API_PREFIX } from '../../shared/constants/app.constants';
import { logger } from '../../shared/logger/logger';

export const createApp = (): Application => {
  const app: Application = express();

  // ── Trust proxy (for load balancers / Docker) ─────────────────────────────
  app.set('trust proxy', 1);

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }),
  );

  // ── Rate Limiting ─────────────────────────────────────────────────────────
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: 'Too many requests from this IP. Please try again later.',
    }),
  );

  // ── Body Parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ── Compression ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── HTTP Request Logging ──────────────────────────────────────────────────
  app.use(
    pinoHttp({
      logger,
      customLogLevel(_req, res) {
        if (res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      customSuccessMessage(req, res) {
        return `${req.method} ${req.url} ${res.statusCode}`;
      },
      // Don't log health check requests to reduce noise
      autoLogging: {
        ignore: (req) => req.url === `${API_PREFIX}/${env.API_VERSION}/health`,
      },
    }),
  );

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use(`${API_PREFIX}/${env.API_VERSION}`, rootRouter);

  // ── 404 Handler ───────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ── Global Error Handler (must be last) ───────────────────────────────────
  app.use(errorHandler);

  return app;
};
