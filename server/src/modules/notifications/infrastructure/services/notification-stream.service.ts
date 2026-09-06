/**
 * @file notification-stream.service.ts
 * @layer Infrastructure › Services
 *
 * Singleton SSE (Server-Sent Events) manager.
 * Keeps a registry of active admin/staff SSE connections
 * and broadcasts real-time notification events to all of them.
 */

import { Response } from 'express';
import { logger } from '@shared/logger/logger';

interface SSEClient {
  id: string;
  res: Response;
  userId: string;
}

export class NotificationStreamService {
  private static instance: NotificationStreamService;
  private clients: Map<string, SSEClient> = new Map();

  private constructor() {}

  public static getInstance(): NotificationStreamService {
    if (!NotificationStreamService.instance) {
      NotificationStreamService.instance = new NotificationStreamService();
    }
    return NotificationStreamService.instance;
  }

  /**
   * Registers a new SSE client. Sets SSE headers and sends an initial "connected" event.
   * Returns a cleanup function to call when the client disconnects.
   */
  public addClient(clientId: string, userId: string, res: Response): () => void {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
    res.flushHeaders();

    const client: SSEClient = { id: clientId, userId, res };
    this.clients.set(clientId, client);

    logger.debug({ clientId, userId, total: this.clients.size }, 'SSE client connected');

    // Send an initial "connected" event
    this.sendToClient(client, 'connected', { message: 'Real-time notifications active' });

    // Set up heartbeat to keep connection alive (every 25s)
    const heartbeat = setInterval(() => {
      try {
        res.write(': ping\n\n');
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
   * Broadcasts a notification event to all connected SSE clients.
   */
  public broadcastNotification(notification: Record<string, unknown>): void {
    if (this.clients.size === 0) return;

    logger.debug({ type: notification.type, clients: this.clients.size }, 'Broadcasting notification via SSE');

    for (const client of this.clients.values()) {
      this.sendToClient(client, 'notification', notification);
    }
  }

  private sendToClient(client: SSEClient, event: string, data: Record<string, unknown>): void {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      logger.warn({ clientId: client.id }, 'Failed to send SSE event, removing client');
      this.removeClient(client.id);
    }
  }

  public getClientCount(): number {
    return this.clients.size;
  }
}
