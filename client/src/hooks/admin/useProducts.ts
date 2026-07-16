import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, CreateProductDTO, UpdateProductDTO } from '@/api/admin/products';
import { toast } from 'sonner';

export const useProducts = () => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getAll(),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: CreateProductDTO) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create product');
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDTO }) => productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update product');
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete product');
    }
  });

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    isError: productsQuery.isError,
    error: productsQuery.error,
    createProduct: createProductMutation.mutate,
    isCreating: createProductMutation.isPending,
    updateProduct: updateProductMutation.mutate,
    isUpdating: updateProductMutation.isPending,
    deleteProduct: deleteProductMutation.mutate,
    isDeleting: deleteProductMutation.isPending,
  };
};
