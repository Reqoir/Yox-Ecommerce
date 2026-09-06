import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/admin/notifications';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Normalise params so that `undefined` values are stripped.
 * This makes useNotifications() and useNotifications({ type: undefined })
 * share the EXACT SAME cache entry — keeping sidebar and page always in sync.
 */
function normaliseParams(params?: { type?: string; isRead?: string }) {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null)
  ) as { type?: string; isRead?: string };
}

export const useNotifications = (params?: { type?: string; isRead?: string }) => {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Both sidebar (no params) and page ({type:undefined}) will produce {} → same cache key
  const clean = normaliseParams(params);
  const hasFilters = Object.keys(clean).length > 0;
  const queryKey = hasFilters
    ? ['notifications', 'list', clean]
    : ['notifications', 'list'];

  const notificationsQuery = useQuery({
    queryKey,
    queryFn: () => notificationApi.getAll(hasFilters ? clean : undefined),
    enabled: isAuthenticated,
    retry: false,
    refetchInterval: isAuthenticated ? 30_000 : false,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id: string) => {
      const queries = queryClient.getQueriesData<{ data: any[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });
      for (const [key, old] of queries) {
        if (!old) continue;
        const existing = old.data || [];
        const item = existing.find((n) => n.id === id);
        const wasUnread = item ? !item.isRead : true;
        queryClient.setQueryData(key, {
          ...old,
          unreadCount: Math.max(0, (old.unreadCount || 0) - (wasUnread ? 1 : 0)),
          data: existing.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        });
      }
    },
    onSuccess: invalidate,
    onError: () => toast.error('Failed to mark notification as read'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      const queries = queryClient.getQueriesData<{ data: any[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });
      for (const [key, old] of queries) {
        if (!old) continue;
        queryClient.setQueryData(key, {
          ...old,
          unreadCount: 0,
          data: (old.data || []).map((n) => ({ ...n, isRead: true })),
        });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const markManyReadMutation = useMutation({
    mutationFn: (ids: string[]) => notificationApi.markManyRead(ids),
    onMutate: async (ids: string[]) => {
      const idSet = new Set(ids);
      const queries = queryClient.getQueriesData<{ data: any[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });
      for (const [key, old] of queries) {
        if (!old) continue;
        const existing = old.data || [];
        const unreadMarked = existing.filter((n) => idSet.has(n.id) && !n.isRead).length;
        queryClient.setQueryData(key, {
          ...old,
          unreadCount: Math.max(0, (old.unreadCount || 0) - unreadMarked),
          data: existing.map((n) => (idSet.has(n.id) ? { ...n, isRead: true } : n)),
        });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Selected notifications marked as read');
    },
    onError: () => toast.error('Failed to mark selected as read'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onMutate: async (id: string) => {
      const queries = queryClient.getQueriesData<{ data: any[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });
      for (const [key, old] of queries) {
        if (!old) continue;
        const existing = old.data || [];
        const item = existing.find((n) => n.id === id);
        const wasUnread = item ? !item.isRead : false;
        queryClient.setQueryData(key, {
          ...old,
          total: Math.max(0, (old.total || 0) - 1),
          unreadCount: Math.max(0, (old.unreadCount || 0) - (wasUnread ? 1 : 0)),
          data: existing.filter((n) => n.id !== id),
        });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Notification deleted');
    },
    onError: () => toast.error('Failed to delete notification'),
  });

  const deleteManyMutation = useMutation({
    mutationFn: (ids: string[]) => notificationApi.deleteMany(ids),
    onMutate: async (ids: string[]) => {
      const idSet = new Set(ids);
      const queries = queryClient.getQueriesData<{ data: any[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });
      for (const [key, old] of queries) {
        if (!old) continue;
        const existing = old.data || [];
        const unreadRemoved = existing.filter((n) => idSet.has(n.id) && !n.isRead).length;
        const remaining = existing.filter((n) => !idSet.has(n.id));
        queryClient.setQueryData(key, {
          ...old,
          total: Math.max(0, (old.total || 0) - ids.length),
          unreadCount: Math.max(0, (old.unreadCount || 0) - unreadRemoved),
          data: remaining,
        });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('Selected notifications deleted');
    },
    onError: () => toast.error('Failed to delete selected notifications'),
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => notificationApi.deleteAll(),
    onMutate: async () => {
      const queries = queryClient.getQueriesData<{ data: any[]; total: number; unreadCount: number }>({
        queryKey: ['notifications'],
      });
      for (const [key, old] of queries) {
        if (!old) continue;
        queryClient.setQueryData(key, {
          ...old,
          total: 0,
          unreadCount: 0,
          data: [],
        });
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success('All notifications deleted');
    },
    onError: () => toast.error('Failed to delete all notifications'),
  });

  return {
    notifications: notificationsQuery.data?.data || [],
    total: notificationsQuery.data?.total || 0,
    unreadCount: notificationsQuery.data?.unreadCount || 0,
    isLoading: notificationsQuery.isLoading,

    markRead: markReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
    isMarkingAllRead: markAllReadMutation.isPending,
    markManyRead: markManyReadMutation.mutate,
    isMarkingManyRead: markManyReadMutation.isPending,
    deleteNotification: deleteMutation.mutate,
    deleteManyNotifications: deleteManyMutation.mutate,
    isDeletingMany: deleteManyMutation.isPending,
    deleteAllNotifications: deleteAllMutation.mutate,
    isDeletingAll: deleteAllMutation.isPending,
  };
};
