/**
 * @file notification.repository.ts
 * @layer Infrastructure › Repositories
 */

import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification, NotificationType } from '../../domain/entities/notification.entity';
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

  private buildUserFilter(userId: string | null, allowedTypes?: NotificationType[]): any {
    if (userId) {
      if (allowedTypes && allowedTypes.length > 0) {
        return {
          $or: [{ userId }, { userId: null, type: { $in: allowedTypes } }],
        };
      }
      if (allowedTypes && allowedTypes.length === 0) {
        return { userId };
      }
      return { $or: [{ userId }, { userId: null }] };
    }

    if (allowedTypes && allowedTypes.length > 0) {
      return { userId: null, type: { $in: allowedTypes } };
    }
    return { userId: null };
  }

  /**
   * Fetches notifications for a user.
   * - If userId is provided: returns user-specific + permitted broadcast notifications
   * - If userId is null: returns only permitted broadcast notifications (admin view)
   */
  async findForUser(
    userId: string | null,
    query: any,
    allowedTypes?: NotificationType[]
  ): Promise<{ data: Notification[]; total: number }> {
    const baseFilter = this.buildUserFilter(userId, allowedTypes);
    const filter: any = { ...baseFilter };

    if (query.type) {
      if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(query.type)) {
        return { data: [], total: 0 };
      }
      filter.type = query.type;
    }
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

  async countUnread(userId: string | null, allowedTypes?: NotificationType[]): Promise<number> {
    const filter: any = {
      ...this.buildUserFilter(userId, allowedTypes),
      isRead: false,
    };

    return NotificationModel.countDocuments(filter).exec();
  }

  async markAllRead(userId: string | null, allowedTypes?: NotificationType[]): Promise<void> {
    const filter: any = {
      ...this.buildUserFilter(userId, allowedTypes),
      isRead: false,
    };

    await NotificationModel.updateMany(filter, { isRead: true, updatedAt: new Date() }).exec();
  }

  async markManyRead(ids: string[]): Promise<void> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) {
      await NotificationModel.updateMany(
        { _id: { $in: validIds } },
        { isRead: true, updatedAt: new Date() }
      ).exec();
    }
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid notification ID');
    await NotificationModel.findByIdAndDelete(id).exec();
  }

  async deleteMany(ids: string[]): Promise<void> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    if (validIds.length > 0) {
      await NotificationModel.deleteMany({ _id: { $in: validIds } }).exec();
    }
  }

  async deleteAll(userId: string | null, allowedTypes?: NotificationType[]): Promise<void> {
    const filter: any = this.buildUserFilter(userId, allowedTypes);

    await NotificationModel.deleteMany(filter).exec();
  }
}
