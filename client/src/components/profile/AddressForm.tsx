'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Address } from '@/api/addresses';
import { COUNTRY_CODES, parsePhoneNumber, getCountryByCode, formatPhoneNumber } from '@/lib/country-codes';

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
    country: 'India',
    zipCode: '',
    isDefault: false,
  });

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const parsed = parsePhoneNumber(initialData.phone);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.number);
      setFormData({
        ...initialData,
        country: initialData.country || getCountryByCode(parsed.countryCode) || 'India',
      });
    } else {
      setCountryCode('+91');
      setPhoneNumber('');
      setFormData({
        fullName: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        country: 'India',
        zipCode: '',
        isDefault: false,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    const suggestedCountry = getCountryByCode(newCode);
    if (suggestedCountry) {
      setFormData((prev) => ({
        ...prev,
        country: suggestedCountry,
      }));
      if (errors['country']) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next['country'];
          return next;
        });
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers, spaces, dashes
    const sanitized = val.replace(/[^\d\s-]/g, '');
    setPhoneNumber(sanitized);
    if (errors['phone']) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next['phone'];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.fullName?.trim() || formData.fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters';
    }

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (!phoneNumber.trim()) {
      errs.phone = 'Phone number is required';
    } else if (countryCode === '+91' && cleanDigits.length !== 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    } else if (cleanDigits.length < 7) {
      errs.phone = 'Phone number must have at least 7 digits';
    }

    if (!formData.street?.trim() || formData.street.trim().length < 3) {
      errs.street = 'Street address must be at least 3 characters';
    }

    if (!formData.city?.trim() || formData.city.trim().length < 2) {
      errs.city = 'City is required';
    }

    if (!formData.state?.trim() || formData.state.trim().length < 2) {
      errs.state = 'State is required';
    }

    if (!formData.zipCode?.trim() || formData.zipCode.trim().length < 3) {
      errs.zipCode = 'Valid postal/ZIP code is required';
    }

    if (!formData.country?.trim()) {
      errs.country = 'Country is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const fullPhone = formatPhoneNumber(countryCode, phoneNumber);
    onSubmit({
      ...formData,
      phone: fullPhone,
      country: formData.country?.trim() || 'India',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {initialData ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="fullName"
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm ${
                  errors.fullName ? 'border-red-500 bg-red-50/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              />
              {errors.fullName && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.fullName}
                </p>
              )}
            </div>
            
            {/* Phone Number with Country Code */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white">
                <select
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2.5 text-xs font-semibold border-r border-gray-200 dark:border-gray-700 outline-none cursor-pointer max-w-[130px] sm:max-w-[150px]"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} ({c.country})
                    </option>
                  ))}
                </select>
                <input 
                  type="tel"
                  name="phone"
                  placeholder={countryCode === '+91' ? '10-digit mobile number' : 'Contact number'}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className={`w-full px-4 py-2.5 bg-transparent outline-none text-sm ${
                    errors.phone ? 'bg-red-50/20' : ''
                  }`}
                />
              </div>
              {errors.phone ? (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.phone}
                </p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-1">
                  Used for delivery coordination and OTP confirmation.
                </p>
              )}
            </div>

            {/* Street Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Street Address / House No. / Area <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="street"
                placeholder="House/Flat No, Building, Street, Landmark"
                value={formData.street}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm ${
                  errors.street ? 'border-red-500 bg-red-50/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              />
              {errors.street && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.street}
                </p>
              )}
            </div>

            {/* City */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="city"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm ${
                  errors.city ? 'border-red-500 bg-red-50/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              />
              {errors.city && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.city}
                </p>
              )}
            </div>

            {/* State */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                State / Province <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="state"
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm ${
                  errors.state ? 'border-red-500 bg-red-50/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              />
              {errors.state && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.state}
                </p>
              )}
            </div>

            {/* ZIP / Postal Code */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ZIP / Postal Code <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="zipCode"
                placeholder="e.g. 400001"
                value={formData.zipCode}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm ${
                  errors.zipCode ? 'border-red-500 bg-red-50/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              />
              {errors.zipCode && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.zipCode}
                </p>
              )}
            </div>

            {/* Country */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Country <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                name="country"
                placeholder="e.g. India"
                value={formData.country}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all text-sm ${
                  errors.country ? 'border-red-500 bg-red-50/20' : 'border-gray-200 dark:border-gray-800'
                }`}
              />
              {errors.country && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={13} /> {errors.country}
                </p>
              )}
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
              className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity shadow-sm"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
