/**
 * @file database.config.ts
 * @layer Infrastructure › Config
 *
 * MongoDB connection configuration.
 * Derives values from the validated env singleton.
 */

import type { ConnectOptions } from 'mongoose';

import { env } from './env';

export interface DatabaseConfig {
  uri: string;
  options: ConnectOptions;
}

export const databaseConfig: DatabaseConfig = {
  uri: env.MONGODB_URI,
  options: {
    // Mongoose 7+ uses native drivers — most options moved to connection string
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45_000,
    family: 4, // Force IPv4
    // Disable runtime autoIndex in production so schema index changes never race across PM2 workers
    // or bypass controlled preflight checks in scripts/migrate-phase1-indexes.ts.
    autoIndex: env.NODE_ENV !== 'production',
  },
};
