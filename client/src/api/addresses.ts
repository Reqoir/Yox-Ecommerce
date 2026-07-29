import api from '../lib/axios';

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAddressDto = Omit<Address, '_id' | 'user' | 'createdAt' | 'updatedAt'>;
export type UpdateAddressDto = Partial<CreateAddressDto>;

export const addressApi = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    return response.data.data;
  },

  addAddress: async (data: CreateAddressDto): Promise<Address> => {
    const response = await api.post('/addresses', data);
    return response.data.data;
  },

  updateAddress: async (id: string, data: UpdateAddressDto): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefaultAddress: async (id: string): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data.data;
  },
};
