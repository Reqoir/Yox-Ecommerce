/**
 * @file notification-stream.service.ts
 * @layer Infrastructure › Services
 *
 * Singleton SSE (Server-Sent Events) manager.
 * Keeps a registry of active admin/staff SSE connections
 * and broadcasts real-time notification events to all of them.
 *
 * Automatically syncs with MongoDB Atlas so that notifications created
 * from any device / server instance are broadcast to all connected clients.
 */

import { Response } from 'express';
import { logger } from '@shared/logger/logger';
import { NotificationModel } from '../repositories/notification.model';

export const NOTIFICATION_TYPE_PERMISSION_MAP: Record<string, string> = {
  NEW_ORDER: 'manage_orders',
  ORDER_CANCELLED: 'manage_orders',
  ORDER_STATUS: 'manage_orders',
  RETURN_REQUEST: 'manage_orders',
  LOW_STOCK: 'manage_inventory',
  NEW_REVIEW: 'manage_reviews',
  NEW_USER: 'manage_users',
};

interface SSEClient {
  id: string;
  res: Response;
  userId: string;
  permissions: string[];
  isAdmin: boolean;
}

export class NotificationStreamService {
  private static instance: NotificationStreamService;
  private clients: Map<string, SSEClient> = new Map();
  private recentBroadcastIds: Set<string> = new Set();
  private watcherInitialized = false;
  private pollInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): NotificationStreamService {
    if (!NotificationStreamService.instance) {
      NotificationStreamService.instance = new NotificationStreamService();
      NotificationStreamService.instance.initDbWatcher();
    }
    return NotificationStreamService.instance;
  }

  /**
   * Registers a new SSE client. Sets SSE headers and sends an initial "connected" event.
   * Returns a cleanup function to call when the client disconnects.
   */
  public addClient(
    clientId: string,
    userId: string,
    res: Response,
    permissions: string[] = [],
    isAdmin = false
  ): () => void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    const client: SSEClient = { id: clientId, userId, res, permissions, isAdmin };
    this.clients.set(clientId, client);

    logger.debug({ clientId, userId, total: this.clients.size }, 'SSE client connected');

    // Send an initial "connected" event
    this.sendToClient(client, 'connected', { message: 'Real-time notifications active' });

    // Set up heartbeat to keep connection alive (every 25s)
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      } catch {
        // Client gone, clean up
        clearInterval(heartbeat);
        this.removeClient(clientId);
      }
    }, 25_000);

    // Return cleanup function
    return () => {
      clearInterval(heartbeat);
      this.removeClient(clientId);
    };
  }

  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
    logger.debug({ clientId, total: this.clients.size }, 'SSE client disconnected');
  }

  /**
   * Broadcasts a notification event to all connected SSE clients who have permission for it.
   */
  public broadcastNotification(notification: Record<string, unknown>): void {
    const id = String(notification.id || notification._id || '');
    if (id) {
      this.recentBroadcastIds.add(id);
      if (this.recentBroadcastIds.size > 500) {
        const first = this.recentBroadcastIds.values().next().value;
        if (first) this.recentBroadcastIds.delete(first);
      }
    }

    if (this.clients.size === 0) return;

    logger.debug({ type: notification.type, clients: this.clients.size }, 'Broadcasting notification via SSE');

    const notifUserId = notification.userId ? String(notification.userId) : null;
    const notifType = String(notification.type || '');
    const requiredPermission = NOTIFICATION_TYPE_PERMISSION_MAP[notifType];

    for (const client of this.clients.values()) {
      // 1. User-specific notification: only send to the intended user
      if (notifUserId) {
        if (client.userId === notifUserId) {
          this.sendToClient(client, 'notification', notification);
        }
        continue;
      }

      // 2. Broadcast notification:
      // Admins or users with '*' or 'manage_notifications' receive all broadcasts
      if (
        client.isAdmin ||
        client.permissions.includes('*') ||
        client.permissions.includes('manage_notifications')
      ) {
        this.sendToClient(client, 'notification', notification);
        continue;
      }

      // If a specific permission is required for this notification type:
      if (requiredPermission) {
        if (client.permissions.includes(requiredPermission)) {
          this.sendToClient(client, 'notification', notification);
        }
      } else if (notifType === 'SYSTEM' && client.permissions.length > 0) {
        // General SYSTEM notifications reach any staff member
        this.sendToClient(client, 'notification', notification);
      }
    }
  }

  private sendToClient(client: SSEClient, event: string, data: Record<string, unknown>): void {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
      if (typeof (client.res as any).flush === 'function') {
        (client.res as any).flush();
      }
    } catch (err) {
      logger.warn({ clientId: client.id }, 'Failed to send SSE event, removing client');
      this.removeClient(client.id);
    }
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Syncs with MongoDB so notifications generated across multiple laptop/server instances
   * or different devices sharing the database are pushed in real time.
   */
  private initDbWatcher(): void {
    if (this.watcherInitialized) return;
    this.watcherInitialized = true;

    // 1. Attempt MongoDB Atlas Change Streams
    try {
      const changeStream = NotificationModel.watch(
        [{ $match: { operationType: 'insert' } }],
        { fullDocument: 'updateLookup' }
      );

      changeStream.on('change', (change: any) => {
        const doc = change.fullDocument;
        if (!doc) return;
        const id = String(doc._id);
        if (this.recentBroadcastIds.has(id)) return;
        this.recentBroadcastIds.add(id);

        this.broadcastNotification({
          id,
          userId: doc.userId,
          type: doc.type,
          title: doc.title,
          message: doc.message,
          isRead: doc.isRead,
          metadata: doc.metadata,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        });
      });

      changeStream.on('error', (err) => {
        logger.warn({ err: err?.message }, '[SSE] Change stream error, relying on DB polling');
      });
    } catch (err: any) {
      logger.warn({ err: err?.message }, '[SSE] Change stream not available, relying on DB polling');
    }

    // 2. Continuous DB polling fallback (checks every 2.5s for any unseen notifications)
    if (this.pollInterval) return;
    let lastChecked = new Date(Date.now() - 60_000);

    this.pollInterval = setInterval(async () => {
      try {
        if (this.clients.size === 0) return;

        const newDocs = await NotificationModel.find({
          createdAt: { $gte: lastChecked },
        })
          .sort({ createdAt: 1 })
          .lean()
          .exec();

        lastChecked = new Date(Date.now() - 2_000); // 2s overlap to prevent race conditions

        for (const doc of newDocs) {
          const id = String(doc._id);
          if (this.recentBroadcastIds.has(id)) continue;
          this.recentBroadcastIds.add(id);

          this.broadcastNotification({
            id,
            userId: doc.userId,
            type: doc.type,
            title: doc.title,
            message: doc.message,
            isRead: doc.isRead,
            metadata: doc.metadata,
            createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
          });
        }
      } catch {
        // Polling error silently handled
      }
    }, 2_500);
  }
}
