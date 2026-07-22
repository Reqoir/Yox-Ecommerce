'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export default function PersonalInfoPage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  
  // We'll use a local state for the form so we don't mutate the store directly
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
    try {
      // In a real app, this would dispatch an update profile action
      // await updateProfile(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Personal Information</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your personal details and contact information
          </p>
        </div>
        
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Edit Profile
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled={true} // Usually email changes require verification
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/80 text-gray-900 dark:text-white cursor-not-allowed opacity-70"
              title="Email address cannot be changed directly"
            />
            <p className="text-xs text-gray-500">To change your email, please contact support.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Reset form
                if (user) {
                  setFormData({
                    fullName: user.fullName || '',
                    phone: user.phone || '',
                    email: user.email || '',
                  });
                }
              }}
              className="px-6 py-2.5 font-medium rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-black text-white dark:bg-white dark:text-black font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Save Changes
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
