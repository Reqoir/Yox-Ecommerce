'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Key, X } from 'lucide-react';
import { AdminChangePasswordCard } from './AdminChangePasswordCard';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function AdminChangePasswordModal({ isOpen, onClose, userEmail, userName }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key and prevent background scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-in fade-in-0 duration-150">
      {/* Fullscreen Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Centered Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-modal-title"
        className="relative w-full max-w-lg bg-card text-card-foreground rounded-2xl border border-border shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 fade-in-0 duration-200"
      >
        {/* Header */}
        <div className="p-5 border-b bg-muted/40 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Key size={20} />
            </div>
            <div>
              <h2 id="change-password-modal-title" className="text-base font-bold text-foreground">
                Change Security Password
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {userName ? `Updating credentials for ${userName}` : 'Update your administrator credentials'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 [scrollbar-width:thin]">
          <AdminChangePasswordCard onSuccess={onClose} isModal />
        </div>
      </div>
    </div>,
    document.body
  );
}
