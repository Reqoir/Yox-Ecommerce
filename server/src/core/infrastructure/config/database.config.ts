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
  },
};
