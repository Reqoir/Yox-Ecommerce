/**
 * @file connection.ts
 * @layer Infrastructure › Database › Mongoose
 *
 * Manages the Mongoose connection lifecycle.
 * Provides connect(), disconnect(), and attaches connection event listeners.
 */

import mongoose from 'mongoose';

import { databaseConfig } from '../../config/database.config';
import { logger } from '../../../../shared/logger/logger';

/**
 * Establish a connection to MongoDB.
 * Should be called once during application bootstrap.
 */
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(databaseConfig.uri, databaseConfig.options);
    logger.info({ uri: sanitizeUri(databaseConfig.uri) }, 'MongoDB connected successfully');
  } catch (error) {
    logger.fatal({ error }, 'MongoDB connection failed');
    process.exit(1);
  }
};

/**
 * Gracefully close the Mongoose connection.
 * Should be called during graceful shutdown.
 */
export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    logger.error({ error }, 'Error during MongoDB disconnection');
  }
};

/**
 * Returns the current Mongoose connection state as a string.
 */
export const getMongooseState = (): string => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] ?? 'unknown';
};

// ─── Event Listeners ─────────────────────────────────────────────────────────

mongoose.connection.on('connected', () => {
  logger.debug('Mongoose: connection established');
});

mongoose.connection.on('error', (err: Error) => {
  logger.error({ error: err.message }, 'Mongoose: connection error');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose: disconnected');
});

mongoose.connection.on('reconnected', () => {
  logger.info('Mongoose: reconnected');
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Strip credentials from the URI before logging.
 */
const sanitizeUri = (uri: string): string => {
  try {
    const url = new URL(uri);
    url.password = '***';
    url.username = url.username ? '***' : '';
    return url.toString();
  } catch {
    return '(invalid URI)';
  }
};
