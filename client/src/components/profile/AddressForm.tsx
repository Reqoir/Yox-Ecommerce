'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Address>) => void;
  initialData?: Address | null;
}

export function AddressForm({ isOpen, onClose, onSubmit, initialData }: AddressFormProps) {
  const [formData, setFormData] = useState<Partial<Address>>({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        isDefault: false,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold">
            {initialData ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Full Name</label>
              <input 
                required
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>
            
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Phone Number</label>
              <input 
                required
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Street Address</label>
              <input 
                required
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">City</label>
              <input 
                required
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">State/Province</label>
              <input 
                required
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">ZIP/Postal Code</label>
              <input 
                required
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Country</label>
              <input 
                required
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 pt-2 cursor-pointer group">
            <div className="relative flex items-center">
              <input 
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="peer sr-only"
              />
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-black peer-checked:border-black dark:peer-checked:bg-white dark:peer-checked:border-white transition-all"></div>
              <svg className="absolute w-3 h-3 text-white dark:text-black left-1 top-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium group-hover:text-black dark:group-hover:text-white transition-colors">
              Set as default shipping address
            </span>
          </label>

          <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-gray-800 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-medium rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
