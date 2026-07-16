import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { brandApi, CreateBrandDTO, UpdateBrandDTO } from '@/api/admin/brands';
import { toast } from 'sonner';

export const useBrands = () => {
  const queryClient = useQueryClient();

  const brandsQuery = useQuery({
    queryKey: ['brands'],
    queryFn: brandApi.getAll,
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: CreateBrandDTO) => brandApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create brand');
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBrandDTO }) => brandApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update brand');
    }
  });

  const deleteBrandMutation = useMutation({
    mutationFn: (id: string) => brandApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete brand');
    }
  });

  return {
    brands: brandsQuery.data || [],
    isLoading: brandsQuery.isLoading,
    isError: brandsQuery.isError,
    error: brandsQuery.error,
    createBrand: createBrandMutation.mutate,
    isCreating: createBrandMutation.isPending,
    updateBrand: updateBrandMutation.mutate,
    isUpdating: updateBrandMutation.isPending,
    deleteBrand: deleteBrandMutation.mutate,
    isDeleting: deleteBrandMutation.isPending,
  };
};
