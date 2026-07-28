/**
 * @file notification.repository.ts
 * @layer Infrastructure › Repositories
 */

import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationModel, INotificationDocument } from './notification.model';
import { Types } from 'mongoose';

export class NotificationRepository implements INotificationRepository {

  private mapToDomain(doc: INotificationDocument): Notification {
    const data = doc.toObject();
    return Notification.reconstitute({
      id: data.id,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: data.isRead,
      metadata: data.metadata,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(notification: Notification): Promise<Notification> {
    const data = notification.toJSON();
    const { id, ...rest } = data;

    if (id) {
      const updated = await NotificationModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Notification not found');
      return this.mapToDomain(updated);
    } else {
      const created = new NotificationModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findById(id: string): Promise<Notification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await NotificationModel.findById(id).exec();
    return doc ? this.mapToDomain(doc) : null;
  }

  /**
   * Fetches notifications for a user.
   * - If userId is provided: returns user-specific + broadcast (userId=null) notifications
   * - If userId is null: returns only broadcast notifications (admin view)
   */
  async findForUser(
    userId: string | null,
    query: any
  ): Promise<{ data: Notification[]; total: number }> {
    const filter: any =
      userId
        ? { $or: [{ userId }, { userId: null }] }
        : { userId: null };

    if (query.type) filter.type = query.type;
    if (query.isRead !== undefined) filter.isRead = query.isRead === 'true';

    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      NotificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      NotificationModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }

  async countUnread(userId: string | null): Promise<number> {
    const filter: any = userId
      ? { $or: [{ userId }, { userId: null }], isRead: false }
      : { userId: null, isRead: false };

    return NotificationModel.countDocuments(filter).exec();
  }

  async markAllRead(userId: string | null): Promise<void> {
    const filter: any = userId
      ? { $or: [{ userId }, { userId: null }], isRead: false }
      : { userId: null, isRead: false };

    await NotificationModel.updateMany(filter, { isRead: true, updatedAt: new Date() }).exec();
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid notification ID');
    await NotificationModel.findByIdAndDelete(id).exec();
  }
}
