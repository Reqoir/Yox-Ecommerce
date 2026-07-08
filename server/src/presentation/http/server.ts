/**
 * @file server.ts
 * @layer Presentation › HTTP
 *
 * Application entry point.
 *
 * Boot sequence:
 *   1. Load and validate environment variables (fails fast on error)
 *   2. Initialise third-party SDKs (Cloudinary)
 *   3. Connect to MongoDB
 *   4. Connect to Redis
 *   5. Start the HTTP server
 *   6. Register graceful shutdown handlers
 */

import 'dotenv/config'; // Must be the FIRST import

import { env } from '../../core/infrastructure/config/env';
import { initCloudinary } from '../../core/infrastructure/config/cloudinary.config';
import { connectMongoDB, disconnectMongoDB } from '../../core/infrastructure/database/mongoose/connection';
import { connectRedis, disconnectRedis } from '../../core/infrastructure/database/redis/connection';
import { logger } from '../../shared/logger/logger';
import { createApp } from './app';

const bootstrap = async (): Promise<void> => {
  // ── 1. Initialise third-party SDKs ────────────────────────────────────────
  initCloudinary();
  logger.info('Cloudinary SDK initialised');

  // ── 2. Connect to MongoDB ─────────────────────────────────────────────────
  await connectMongoDB();

  // ── 3. Connect to Redis ───────────────────────────────────────────────────
  await connectRedis();

  // ── 4. Create the Express app ─────────────────────────────────────────────
  const app = createApp();

  // ── 5. Start HTTP server ──────────────────────────────────────────────────
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        environment: env.NODE_ENV,
        apiBase: `/api/${env.API_VERSION}`,
      },
      `🚀 Server running on port ${env.PORT}`,
    );
  });

  // ── 6. Graceful Shutdown ──────────────────────────────────────────────────
  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal. Shutting down gracefully...');

    server.close(async (err) => {
      if (err) {
        logger.error({ err }, 'Error while closing HTTP server');
        process.exit(1);
      }

      try {
        await disconnectMongoDB();
        await disconnectRedis();
        logger.info('All connections closed. Process exiting.');
        process.exit(0);
      } catch (shutdownErr) {
        logger.error({ error: shutdownErr }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if graceful fails
    setTimeout(() => {
      logger.fatal('Forced shutdown after 10s timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  // ── 7. Unhandled rejection / uncaught exception guards ────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ reason }, 'Unhandled Promise Rejection — shutting down');
    void gracefulShutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err: Error) => {
    logger.fatal({ err }, 'Uncaught Exception — shutting down');
    void gracefulShutdown('uncaughtException');
  });
};

void bootstrap();
