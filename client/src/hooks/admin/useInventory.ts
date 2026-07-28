import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, UpdateInventoryDTO, AdjustStockDTO } from '@/api/admin/inventory';
import { toast } from 'sonner';

export const useInventory = (params?: { page?: number; limit?: number }) => {
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ['inventory', params],
    queryFn: () => inventoryApi.getAll(params),
  });

  const lowStockQuery = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: () => inventoryApi.getLowStock(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInventoryDTO }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update inventory');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AdjustStockDTO }) =>
      inventoryApi.adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Stock adjusted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to adjust stock');
    },
  });

  return {
    inventory: inventoryQuery.data?.data || [],
    total: inventoryQuery.data?.total || 0,
    isLoading: inventoryQuery.isLoading,
    isError: inventoryQuery.isError,

    lowStockItems: lowStockQuery.data?.data || [],
    lowStockTotal: lowStockQuery.data?.total || 0,
    isLoadingLowStock: lowStockQuery.isLoading,

    updateInventory: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    adjustStock: adjustStockMutation.mutate,
    isAdjusting: adjustStockMutation.isPending,
  };
};

export const useStockLogs = (inventoryId: string | null) => {
  return useQuery({
    queryKey: ['stock-logs', inventoryId],
    queryFn: () => inventoryApi.getLogs(inventoryId!),
    enabled: !!inventoryId,
  });
};
