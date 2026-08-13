'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2, Home, Building2, Check } from 'lucide-react';
import { AddressForm } from '@/components/profile/AddressForm';
import { toast } from 'sonner';
import { addressApi, Address, CreateAddressDto, UpdateAddressDto } from '@/api/addresses';

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await addressApi.getAddresses();
      setAddresses(data);
    } catch (error) {
      toast.error('Failed to load addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this saved address?')) return;
    try {
      await addressApi.deleteAddress(id);
      setAddresses(addresses.filter(a => a._id !== id));
      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updatedAddress = await addressApi.setDefaultAddress(id);
      setAddresses(addresses.map(a => ({
        ...a,
        isDefault: a._id === updatedAddress._id
      })));
      toast.success('Default delivery address updated');
    } catch (error) {
      toast.error('Failed to set default address');
    }
  };

  const handleFormSubmit = async (data: Partial<Address>) => {
    try {
      if (editingAddress) {
        const updated = await addressApi.updateAddress(editingAddress._id, data as UpdateAddressDto);
        setAddresses(addresses.map(a => {
          if (a._id === updated._id) return updated;
          if (updated.isDefault) return { ...a, isDefault: false };
          return a;
        }));
        toast.success('Address updated successfully');
      } else {
        const newAddress = await addressApi.addAddress(data as CreateAddressDto);
        let newAddresses = [...addresses, newAddress];
        if (newAddress.isDefault) {
          newAddresses = newAddresses.map(a => a._id === newAddress._id ? a : { ...a, isDefault: false });
        }
        setAddresses(newAddresses);
        toast.success('New address added successfully');
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save address');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Saved Addresses</h2>
          <p className="text-xs text-gray-500 mt-1">Manage delivery locations for express checkout & return pickups</p>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Address</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-xl bg-gray-100 animate-pulse border border-gray-200" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
            <MapPin size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No Saved Addresses</h3>
          <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
            You haven't saved any delivery locations yet. Add an address now for faster 1-click checkout.
          </p>
          <button
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Add Address Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`relative p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                address.isDefault
                  ? 'border-[#1A2E4C] bg-blue-50/20 shadow-2xs'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{address.fullName}</span>
                  </div>

                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-[#1A2E4C] text-white rounded-full uppercase tracking-wider shadow-2xs">
                      <CheckCircle2 size={12} /> Default
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-gray-600 font-semibold mb-2">{address.phone}</p>

                <div className="text-xs text-gray-600 leading-relaxed space-y-0.5">
                  <p>{address.street}</p>
                  <p>{address.city}, {address.state} - <span className="font-mono font-bold">{address.zipCode}</span></p>
                  <p className="font-medium text-gray-800">{address.country}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center gap-1.5 font-bold text-[#1A2E4C] hover:underline"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => handleDelete(address._id)}
                    className="flex items-center gap-1.5 font-semibold text-rose-600 hover:underline"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>

                {!address.isDefault && (
                  <button
                    onClick={() => handleSetDefault(address._id)}
                    className="text-xs font-bold text-gray-600 hover:text-[#1A2E4C] hover:underline transition-colors"
                  >
                    Set Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingAddress}
      />
    </div>
  );
}
