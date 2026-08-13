'use client';

import React, { useState } from 'react';
import { Settings, Bell, Shield, Key, Check, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [returnUpdates, setReturnUpdates] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Notification preferences updated successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    setTimeout(() => {
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Security password changed successfully!');
    }, 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Account Settings</h2>
        <p className="text-xs text-gray-500 mt-1">Configure your notifications, security, and profile preferences</p>
      </div>

      {/* Notifications Preferences Form */}
      <form onSubmit={handleSavePreferences} className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#1A2E4C]" />
          <h3 className="text-sm font-bold text-gray-900">Communication & Notifications</h3>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="font-bold text-gray-900">Order & Logistics Tracking Updates</p>
              <p className="text-gray-500 text-[11px]">Receive real-time notifications when your order status changes.</p>
            </div>
            <input
              type="checkbox"
              checked={orderUpdates}
              onChange={(e) => setOrderUpdates(e.target.checked)}
              className="w-4 h-4 text-[#1A2E4C] rounded border-gray-300 focus:ring-[#1A2E4C]"
            />
          </div>

          <div className="border-t border-gray-200 pt-3 flex items-center justify-between py-1">
            <div>
              <p className="font-bold text-gray-900">Return & Refund Status Alerts</p>
              <p className="text-gray-500 text-[11px]">Receive pickup driver assignment & refund completed notifications.</p>
            </div>
            <input
              type="checkbox"
              checked={returnUpdates}
              onChange={(e) => setReturnUpdates(e.target.checked)}
              className="w-4 h-4 text-[#1A2E4C] rounded border-gray-300 focus:ring-[#1A2E4C]"
            />
          </div>

          <div className="border-t border-gray-200 pt-3 flex items-center justify-between py-1">
            <div>
              <p className="font-bold text-gray-900">SMS Express Notifications</p>
              <p className="text-gray-500 text-[11px]">Send SMS alerts for delivery executive arrivals.</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-[#1A2E4C] rounded border-gray-300 focus:ring-[#1A2E4C]"
            />
          </div>

          <div className="border-t border-gray-200 pt-3 flex items-center justify-between py-1">
            <div>
              <p className="font-bold text-gray-900">Exclusive Sales & Member Offers</p>
              <p className="text-gray-500 text-[11px]">Receive early access to seasonal discount sales and new arrivals.</p>
            </div>
            <input
              type="checkbox"
              checked={promotionalEmails}
              onChange={(e) => setPromotionalEmails(e.target.checked)}
              className="w-4 h-4 text-[#1A2E4C] rounded border-gray-300 focus:ring-[#1A2E4C]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Save size={14} />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Security Password Change */}
      <form onSubmit={handleChangePassword} className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-[#1A2E4C]" />
          <h3 className="text-sm font-bold text-gray-900">Security & Password</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-xl">
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1">Current Password *</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E4C]/20 focus:border-[#1A2E4C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">New Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E4C]/20 focus:border-[#1A2E4C]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">Confirm New Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1A2E4C]/20 focus:border-[#1A2E4C]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <Shield size={14} />
              <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
