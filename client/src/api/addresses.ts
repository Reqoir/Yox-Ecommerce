import api from '../lib/axios';

export interface Address {
  id?: string;
  _id?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
  user?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateAddressDto = Omit<Address, 'id' | '_id' | 'user' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateAddressDto = Partial<CreateAddressDto>;

const normalizeAddress = (a: any): Address => ({
  ...a,
  id: a?.id || a?._id,
  _id: a?._id || a?.id,
});

export const addressApi = {
  getAddresses: async (): Promise<Address[]> => {
    const response = await api.get('/addresses');
    const list = response.data?.data || [];
    return list.map(normalizeAddress);
  },

  addAddress: async (data: CreateAddressDto): Promise<Address> => {
    const response = await api.post('/addresses', data);
    return normalizeAddress(response.data?.data);
  },

  updateAddress: async (id: string, data: UpdateAddressDto): Promise<Address> => {
    const response = await api.put(`/addresses/${id}`, data);
    return normalizeAddress(response.data?.data);
  },

  deleteAddress: async (id: string): Promise<void> => {
    await api.delete(`/addresses/${id}`);
  },

  setDefaultAddress: async (id: string): Promise<Address> => {
    const response = await api.patch(`/addresses/${id}/default`);
    return normalizeAddress(response.data?.data);
  },
};
