import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/admin/notifications';
import { toast } from 'sonner';

export const useNotifications = (params?: { type?: string; isRead?: string }) => {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationApi.getAll(params),
    refetchInterval: 30_000, // Poll every 30s for new notifications
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Failed to mark notification as read'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  return {
    notifications: notificationsQuery.data?.data || [],
    total: notificationsQuery.data?.total || 0,
    unreadCount: notificationsQuery.data?.unreadCount || 0,
    isLoading: notificationsQuery.isLoading,

    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
    deleteNotification: deleteMutation.mutate,
  };
};
