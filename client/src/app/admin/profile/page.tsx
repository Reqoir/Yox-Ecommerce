'use client';

import React, { useMemo } from 'react';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { AdminCredentialsCard } from '@/components/admin/AdminCredentialsCard';
import { AdminChangePasswordCard } from '@/components/admin/AdminChangePasswordCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserCog,
  ShieldCheck,
  Key,
  Mail,
  Phone,
  Calendar,
  Lock,
  Shield,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function AdminProfilePage() {
  const { user } = useAdminAuthStore();

  const formattedRole = useMemo(() => {
    if (!user?.role) return 'Staff Member';
    const r = user.role.toUpperCase();
    if (r === 'ADMIN' || r === 'SUPER_ADMIN') return 'Administrator';
    if (r === 'MANAGER') return 'Store Manager';
    if (r === 'SUPPORT') return 'Customer Support';
    return user.role;
  }, [user?.role]);

  const permissionsList = useMemo(() => {
    return user?.permissions || [];
  }, [user?.permissions]);

  const isAdmin = useMemo(() => {
    const r = (user?.role || '').toUpperCase();
    return r === 'ADMIN' || r === 'SUPER_ADMIN' || permissionsList.includes('*');
  }, [user?.role, permissionsList]);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Account Settings
          </h1>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
            Personal Credentials
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Manage your personal staff login email, OTP-verified contact number, and account security password.
        </p>
      </div>

      {/* Staff Identity Snapshot Card */}
      <Card className="rounded-2xl border bg-card shadow-xs">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xl uppercase border border-primary/20 shrink-0 shadow-xs">
                {user?.fullName ? user.fullName.charAt(0) : user?.email?.charAt(0) || 'S'}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-base sm:text-lg text-foreground">
                    {user?.fullName || 'Staff Member'}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold"
                  >
                    ACTIVE ACCOUNT
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user?.email || 'admin@yox.com'}
                  </span>
                  {user?.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="h-3 w-3" />
                      +91 {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block tracking-wider">
                Assigned Staff Role
              </span>
              <span className="text-sm font-extrabold text-foreground capitalize mt-0.5">
                {formattedRole}
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {isAdmin ? 'Full administrative authority' : `${permissionsList.length} permissions assigned`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1: Work Email & Recovery Phone */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={18} />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Login Email & Phone Number</CardTitle>
              <CardDescription className="text-xs">
                Your official credentials used to sign into the Admin Dashboard. Changes are verified via SMS OTP.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AdminCredentialsCard />
        </CardContent>
      </Card>

      {/* Section 2: Update Security Password */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Key size={18} />
            </div>
            <div>
              <CardTitle className="text-base font-bold">Security Password</CardTitle>
              <CardDescription className="text-xs">
                Change your dashboard password. If you forgot your current password, you can reset it instantly using Mobile OTP.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 sm:p-5 rounded-2xl border bg-card">
            <AdminChangePasswordCard />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Staff Assigned Permissions Scope */}
      <Card className="rounded-2xl border shadow-xs bg-muted/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-muted-foreground" />
            <CardTitle className="text-sm font-bold">Your Permissions Scope</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Administrative privileges and dashboard modules assigned to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/5 p-3 rounded-xl border border-primary/15">
              <CheckCircle2 size={15} className="text-primary shrink-0" />
              <span>Full Store Access &mdash; Super Admin privileges on all modules.</span>
            </div>
          ) : permissionsList.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {permissionsList.map((perm) => (
                <span
                  key={perm}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-background border border-border/70 text-foreground"
                >
                  {perm}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Standard staff access</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

