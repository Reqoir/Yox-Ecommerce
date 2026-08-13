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
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Personal Information</h2>
          <p className="text-xs text-gray-500 mt-1">Update your primary identity details and contact preferences</p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs self-start sm:self-auto"
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
              className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-colors"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A2E4C]/10 text-[#1A2E4C] flex items-center justify-center font-bold shrink-0">
            <User size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Account Name</span>
            <span className="text-xs font-bold text-gray-900 truncate block">{user?.fullName || 'Not provided'}</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
            <Mail size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Verified Email</span>
            <span className="text-xs font-bold text-gray-900 truncate block">{user?.email || 'N/A'}</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
            <Phone size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone Contact</span>
            <span className="text-xs font-bold text-gray-900 truncate block">{user?.phone || 'Not linked'}</span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1.5">
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
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20 focus:border-[#1A2E4C] transition-all disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-800">
                Email Address (Primary Login)
              </label>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Lock size={10} /> Locked for security
              </span>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled={true}
              className="w-full px-3.5 py-2.5 text-xs text-gray-600 border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed font-medium"
            />
            <p className="text-[11px] text-gray-400 mt-1">Your registered email address is used for order confirmations and password recovery.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="+91 98765 43210"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20 focus:border-[#1A2E4C] transition-all disabled:bg-gray-50 disabled:text-gray-600 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">Used by delivery partners for delivery updates and return pickup calls.</p>
          </div>
        </div>

        {/* Security Assurance Banner */}
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900 max-w-2xl">
          <ShieldCheck size={18} className="text-[#1A2E4C] shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[#1A2E4C]">Your Privacy & Data Protection</p>
            <p className="text-gray-600 text-[11px] mt-0.5">
              YOX Men's Fashion encrypts personal data using SSL 256-bit protocols. Your details are never shared with third parties except for order delivery execution.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
