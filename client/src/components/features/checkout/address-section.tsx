'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Plus, CheckCircle2, Home, Briefcase, Trash2, X, Loader2 } from 'lucide-react';
import { useCheckoutStore, Address } from '@/store/useCheckoutStore';
import { toast } from 'sonner';
import { COUNTRY_CODES, getCountryByCode, formatPhoneNumber } from '@/lib/country-codes';
import { getApiErrorMessage } from '@/lib/utils';

export function AddressSection() {
  const {
    addresses,
    selectedAddressId,
    selectAddress,
    addAddress,
    removeAddress,
    fetchAddresses,
    isLoadingAddresses,
    isAddAddressOpen,
    setIsAddAddressOpen,
  } = useCheckoutStore();

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    zipCode: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    
    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (countryCode === '+91' && cleanDigits.length !== 10) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    } else if (cleanDigits.length < 7) {
      newErrors.phone = 'Phone number must have at least 7 digits';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'Pincode is required';
    } else if (countryCode === '+91' && !/^\d{6}$/.test(formData.zipCode.replace(/\D/g, ''))) {
      newErrors.zipCode = 'Enter a valid 6-digit pincode';
    } else if (formData.zipCode.trim().length < 3) {
      newErrors.zipCode = 'Enter a valid postal/zip code';
    }

    if (!formData.street.trim() || formData.street.trim().length < 3) {
      newErrors.street = 'Street address must be at least 3 characters';
    }
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPhone = formatPhoneNumber(countryCode, phoneNumber);
      await addAddress({
        fullName: formData.fullName.trim(),
        phone: fullPhone,
        zipCode: formData.zipCode.trim(),
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        country: formData.country.trim() || 'India',
      });

      toast.success('New delivery address added');
      setIsAddAddressOpen(false);
      setFormData({
        fullName: '',
        zipCode: '',
        street: '',
        city: '',
        state: '',
        country: 'India',
      });
      setPhoneNumber('');
      setCountryCode('+91');
      setErrors({});
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to add address'));
    } finally {
      setIsSubmitting(false);
    }
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
      {isLoadingAddresses ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#1A2E4C] animate-spin mb-2" />
          <p className="text-xs text-gray-500">Loading your addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 border border-gray-100 rounded">
          <p className="text-sm text-gray-500 font-medium mb-3">No delivery addresses found.</p>
          <button
            onClick={() => setIsAddAddressOpen(true)}
            className="text-xs font-bold text-[#1A2E4C] hover:underline"
          >
            Add your first address
          </button>
        </div>
      ) : (
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
                  </div>

                  {isSelected && (
                    <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  )}
                </div>

                <p className="text-xs text-gray-600 mb-1 leading-relaxed">{addr.street}</p>
                <p className="text-xs font-medium text-gray-800 mb-2">
                  {addr.city}, {addr.state} - <span className="font-bold">{addr.zipCode}</span>
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
      )}

      {/* Add New Address Modal Overlay */}
      {isAddAddressOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-md max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Add Delivery Address</h3>
              <button
                onClick={() => {
                  setIsAddAddressOpen(false);
                  setErrors({});
                }}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded outline-none bg-white text-gray-900 placeholder-gray-400 ${
                      errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A2E4C]'
                    }`}
                  />
                  {errors.fullName && <p className="text-red-500 text-[10px] mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Phone Number *</label>
                  <div className="flex rounded border border-gray-300 overflow-hidden focus-within:border-[#1A2E4C]">
                    <select
                      value={countryCode}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setCountryCode(newCode);
                        const c = getCountryByCode(newCode);
                        if (c) {
                          setFormData((prev) => ({ ...prev, country: c }));
                        }
                      }}
                      className="bg-gray-50 text-gray-800 px-2 py-2 text-xs font-semibold border-r border-gray-300 outline-none cursor-pointer max-w-[125px]"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      placeholder={countryCode === '+91' ? '10-digit mobile number' : 'Contact number'}
                      value={phoneNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d\s-]/g, '');
                        setPhoneNumber(val);
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      className={`flex-1 min-w-0 px-3 py-2 outline-none bg-white text-gray-900 placeholder-gray-400 ${
                        errors.phone ? 'bg-red-50/20' : ''
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-[10px] mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="6-digit pincode"
                    value={formData.zipCode}
                    onChange={(e) => {
                      setFormData({ ...formData, zipCode: e.target.value });
                      if (errors.zipCode) setErrors({ ...errors, zipCode: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded outline-none bg-white text-gray-900 placeholder-gray-400 ${
                      errors.zipCode ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A2E4C]'
                    }`}
                  />
                  {errors.zipCode && <p className="text-red-500 text-[10px] mt-1">{errors.zipCode}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India"
                    value={formData.country}
                    onChange={(e) => {
                      setFormData({ ...formData, country: e.target.value });
                      if (errors.country) setErrors({ ...errors, country: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded outline-none bg-white text-gray-900 placeholder-gray-400 ${
                      errors.country ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A2E4C]'
                    }`}
                  />
                  {errors.country && <p className="text-red-500 text-[10px] mt-1">{errors.country}</p>}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Street Address / House No / Area *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Flat/House No, Building Name, Street Name"
                  value={formData.street}
                  onChange={(e) => {
                    setFormData({ ...formData, street: e.target.value });
                    if (errors.street) setErrors({ ...errors, street: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded outline-none bg-white text-gray-900 placeholder-gray-400 ${
                    errors.street ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A2E4C]'
                  }`}
                />
                {errors.street && <p className="text-red-500 text-[10px] mt-1">{errors.street}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">City / Town *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({ ...formData, city: e.target.value });
                      if (errors.city) setErrors({ ...errors, city: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded outline-none bg-white text-gray-900 placeholder-gray-400 ${
                      errors.city ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A2E4C]'
                    }`}
                  />
                  {errors.city && <p className="text-red-500 text-[10px] mt-1">{errors.city}</p>}
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={formData.state}
                    onChange={(e) => {
                      setFormData({ ...formData, state: e.target.value });
                      if (errors.state) setErrors({ ...errors, state: '' });
                    }}
                    className={`w-full px-3 py-2 border rounded outline-none bg-white text-gray-900 placeholder-gray-400 ${
                      errors.state ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-[#1A2E4C]'
                    }`}
                  />
                  {errors.state && <p className="text-red-500 text-[10px] mt-1">{errors.state}</p>}
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
