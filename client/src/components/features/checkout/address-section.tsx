'use client';

import React, { useState } from 'react';
import { MapPin, Plus, CheckCircle2, Home, Briefcase, Trash2, X } from 'lucide-react';
import { useCheckoutStore, Address } from '@/store/useCheckoutStore';
import { toast } from 'sonner';

export function AddressSection() {
  const {
    addresses,
    selectedAddressId,
    selectAddress,
    addAddress,
    removeAddress,
    isAddAddressOpen,
    setIsAddAddressOpen,
  } = useCheckoutStore();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    streetAddress: '',
    landmark: '',
    city: '',
    state: '',
    type: 'HOME' as 'HOME' | 'WORK',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.pincode || !formData.streetAddress || !formData.city || !formData.state) {
      toast.error('Please fill in all required address fields');
      return;
    }

    addAddress({
      fullName: formData.fullName,
      phone: formData.phone,
      pincode: formData.pincode,
      streetAddress: formData.streetAddress,
      landmark: formData.landmark || undefined,
      city: formData.city,
      state: formData.state,
      type: formData.type,
    });

    toast.success('New delivery address added');
    setIsAddAddressOpen(false);
    setFormData({
      fullName: '',
      phone: '',
      pincode: '',
      streetAddress: '',
      landmark: '',
      city: '',
      state: '',
      type: 'HOME',
    });
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded p-5 lg:p-6 mb-6">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1A2E4C] text-white rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">Delivery Address</h2>
            <p className="text-xs text-gray-500">Select or add a shipping address</p>
          </div>
        </div>

        <button
          onClick={() => setIsAddAddressOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#1A2E4C] hover:text-[#132238] bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded transition-colors"
        >
          <Plus size={15} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Saved Addresses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;

          return (
            <div
              key={addr.id}
              onClick={() => selectAddress(addr.id)}
              className={`cursor-pointer rounded border p-4 transition-all relative ${
                isSelected
                  ? 'border-black bg-white'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                    {addr.type === 'HOME' ? <Home size={10} /> : <Briefcase size={10} />}
                    {addr.type}
                  </span>
                </div>

                {isSelected && (
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                )}
              </div>

              <p className="text-xs text-gray-600 mb-1 leading-relaxed">{addr.streetAddress}</p>
              {addr.landmark && <p className="text-xs text-gray-500 mb-1">Landmark: {addr.landmark}</p>}
              <p className="text-xs font-medium text-gray-800 mb-2">
                {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
              </p>
              <p className="text-xs text-gray-500">Phone: <span className="font-semibold text-gray-800">{addr.phone}</span></p>

              {/* Remove Address Option */}
              {addresses.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAddress(addr.id);
                    toast.success('Address removed');
                  }}
                  className="absolute bottom-3 right-3 text-gray-400 hover:text-red-600 p-1 transition-colors"
                  title="Delete address"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Address Modal Overlay */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add Delivery Address</h3>
              <button
                onClick={() => setIsAddAddressOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-[#1A2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-[#1A2E4C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-[#1A2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Address Type</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'HOME' })}
                      className={`flex-1 py-2 rounded font-bold border text-center ${
                        formData.type === 'HOME'
                          ? 'border-[#1A2E4C] bg-[#1A2E4C] text-white'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      HOME
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'WORK' })}
                      className={`flex-1 py-2 rounded font-bold border text-center ${
                        formData.type === 'WORK'
                          ? 'border-[#1A2E4C] bg-[#1A2E4C] text-white'
                          : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      WORK
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Street Address / House No / Area *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Flat/House No, Building Name, Street Name"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-[#1A2E4C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-[#1A2E4C]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-[#1A2E4C]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddAddressOpen(false)}
                  className="px-4 py-2 font-bold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1A2E4C] text-white font-bold rounded hover:bg-[#132238] transition-colors"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
