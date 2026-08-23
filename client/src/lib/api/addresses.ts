import apiClient from '../axios';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  pincode: string;
  streetAddress: string;
  landmark?: string;
  city: string;
  state: string;
  type: 'HOME' | 'WORK';
  isDefault?: boolean;
}

export type CreateAddressPayload = Omit<Address, 'id' | 'isDefault'>;
export type UpdateAddressPayload = Partial<CreateAddressPayload>;

export const addressesApi = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await apiClient.get<{ data: Address[] }>('/addresses');
    return response.data?.data || [];
  },

  addAddress: async (payload: CreateAddressPayload): Promise<Address> => {
    const response = await apiClient.post<{ data: Address }>('/addresses', payload);
    return response.data?.data;
  },

  updateAddress: async (id: string, payload: UpdateAddressPayload): Promise<Address> => {
    const response = await apiClient.put<{ data: Address }>(`/addresses/${id}`, payload);
    return response.data?.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await apiClient.delete(`/addresses/${id}`);
  },

  setDefaultAddress: async (id: string): Promise<Address> => {
    const response = await apiClient.patch<{ data: Address }>(`/addresses/${id}/default`);
    return response.data?.data;
  },
};
