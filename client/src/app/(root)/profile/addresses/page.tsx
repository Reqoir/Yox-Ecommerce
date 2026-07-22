'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, CheckCircle2 } from 'lucide-react';
import { AddressForm } from '@/components/profile/AddressForm';
import { toast } from 'sonner';

// Mock data type, replace with real API call later
interface Address {
  _id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // In a real app, this would fetch from your API
  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setAddresses([
        {
          _id: '1',
          fullName: 'John Doe',
          phone: '+1 234 567 8900',
          street: '123 Main St, Apt 4B',
          city: 'New York',
          state: 'NY',
          country: 'United States',
          zipCode: '10001',
          isDefault: true,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleAddNew = () => {
    setEditingAddress(null);
    setIsFormOpen(true);
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    // Implement delete API call
    setAddresses(addresses.filter(a => a._id !== id));
    toast.success('Address deleted successfully');
  };

  const handleSetDefault = (id: string) => {
    // Implement set default API call
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a._id === id
    })));
    toast.success('Default address updated');
  };

  const handleFormSubmit = (data: Partial<Address>) => {
    if (editingAddress) {
      // Update logic
      setAddresses(addresses.map(a => {
        if (a._id === editingAddress._id) {
          return { ...a, ...data } as Address;
        }
        if (data.isDefault) {
          return { ...a, isDefault: false }; // Unset other defaults
        }
        return a;
      }));
      toast.success('Address updated successfully');
    } else {
      // Create logic
      const newAddress = {
        ...data,
        _id: Math.random().toString(), // Mock ID
      } as Address;
      
      let newAddresses = [...addresses, newAddress];
      if (newAddress.isDefault) {
        newAddresses = newAddresses.map(a => a._id === newAddress._id ? a : { ...a, isDefault: false });
      }
      setAddresses(newAddresses);
      toast.success('Address added successfully');
    }
    setIsFormOpen(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Saved Addresses</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your shipping and billing addresses
          </p>
        </div>
        
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Add New
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No addresses saved</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
            You haven't saved any addresses yet. Add one now to make checkout faster.
          </p>
          <button 
            onClick={handleAddNew}
            className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Add Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div 
              key={address._id}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                address.isDefault 
                  ? 'border-black dark:border-white bg-gray-50 dark:bg-gray-900/50' 
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              {address.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Default
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-lg">{address.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{address.phone}</p>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-6">
                <p>{address.street}</p>
                <p>{address.city}, {address.state} {address.zipCode}</p>
                <p>{address.country}</p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button 
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                <button 
                  onClick={() => handleDelete(address._id)}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                
                {!address.isDefault && (
                  <>
                    <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 ml-auto"></div>
                    <button 
                      onClick={() => handleSetDefault(address._id)}
                      className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors ml-auto"
                    >
                      Set as Default
                    </button>
                  </>
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
