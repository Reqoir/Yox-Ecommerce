'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { profileApi, UpdateProfileDto } from '@/api/profile';
import { User, Mail, Phone, ShieldCheck, Edit3, Save, X, Lock } from 'lucide-react';

export default function PersonalInfoPage() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        fullName: formData.fullName,
        phone: formData.phone,
      };
      const updatedUser = await profileApi.updateProfile(updateData);
      setUser(updatedUser);
      toast.success('Personal profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update personal info.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Personal Information</h2>
          <p className="text-xs text-gray-500 mt-1">Update your primary identity details and contact preferences</p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-medium rounded-sm transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Edit Information</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (user) {
                  setFormData({
                    fullName: user.fullName || '',
                    phone: user.phone || '',
                    email: user.email || '',
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-sm transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-medium rounded-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Save size={14} />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Overview Cards - Admin KPI Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-sm bg-gray-100 text-gray-900 flex items-center justify-center font-semibold shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Account Name</span>
            <span className="text-xs font-medium text-gray-900 truncate block">{user?.fullName || 'Not provided'}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-semibold shrink-0">
            <Mail size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Verified Email</span>
            <span className="text-xs font-medium text-gray-900 truncate block">{user?.email || 'N/A'}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-sm bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-semibold shrink-0">
            <Phone size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">Phone Contact</span>
            <span className="text-xs font-medium text-gray-900 truncate block">{user?.phone || 'Not linked'}</span>
          </div>
        </div>
      </div>

      {/* Form Fields - Admin Input Styling */}
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs font-medium text-gray-800 block mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50/70 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-1.5 sm:gap-2">
              <label className="text-xs font-medium text-gray-800">
                Email Address (Primary Login)
              </label>
              <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-sm flex items-center gap-1 self-start sm:self-auto">
                <Lock size={10} /> Locked for security
              </span>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled={true}
              className="w-full px-3.5 py-2.5 text-xs text-gray-500 border border-gray-200 rounded-sm bg-gray-50/80 cursor-not-allowed font-normal"
            />
            <p className="text-[11px] text-gray-400 mt-1">Your registered email address is used for order confirmations and password recovery.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-800 block mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50/70 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Used by delivery partners for delivery updates and return pickup calls.</p>
          </div>
        </div>

        {/* Security Assurance Banner */}
        <div className="p-4 bg-white border border-gray-200 rounded-sm flex items-start gap-3.5 text-xs text-gray-900 max-w-2xl shadow-2xs">
          <ShieldCheck size={18} className="text-black shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Your Privacy & Data Protection</p>
            <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
              YOX Men's Fashion encrypts personal data using SSL 256-bit protocols. Your details are never shared with third parties except for order delivery execution.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
