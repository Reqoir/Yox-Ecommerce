'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { userApi, User } from '@/api/admin/users';
import { roleApi, Role } from '@/api/admin/roles';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  Ban,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Lock,
  X,
  KeyRound,
  Layers,
  Check,
  UserPlus,
  ArrowRight,
  UserSearch,
  Loader2,
  Pencil,
  MoreHorizontal,
  MoreVertical,
  RotateCcw,
  Archive,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';

export default function StaffManagementPage() {
  const { user: currentUser } = useAdminAuthStore();

  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;
    const emailLower = (currentUser.email || '').toLowerCase();
    const roleUpper = (currentUser.role || currentUser.roleId || '').toUpperCase();
    const permissions = currentUser.permissions || [];
    return (
      emailLower === 'admin@yox.com' ||
      roleUpper === 'ADMIN' ||
      roleUpper === 'SUPER_ADMIN' ||
      permissions.includes('*')
    );
  }, [currentUser]);

  const isStoreOwner = useMemo(() => {
    if (!currentUser) return false;
    return (currentUser.email || '').toLowerCase() === 'admin@yox.com';
  }, [currentUser]);

  const canManageStaff = useMemo(() => {
    if (!currentUser) return false;
    if (isSuperAdmin) return true;
    const permissions = currentUser.permissions || [];
    return (
      permissions.includes('manage_staff') ||
      permissions.includes('manage_users') ||
      permissions.includes('manage_roles')
    );
  }, [currentUser, isSuperAdmin]);

  const [staffList, setStaffList] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Search & Filters for table
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add Staff Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'create' | 'promote'>('create');
  const [showPassword, setShowPassword] = useState(false);

  // Mode 1: Create Brand New Staff
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    roleId: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [archivedSuggestion, setArchivedSuggestion] = useState<User | null>(null);
  const [isCheckingArchived, setIsCheckingArchived] = useState(false);

  // Mode 2: Search & Promote Existing User
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState<User | null>(null);
  const [promoteRoleId, setPromoteRoleId] = useState('');
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promotePassword, setPromotePassword] = useState('');
  const [showPromotePassword, setShowPromotePassword] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // Reset Staff Password Dialog
  const [staffToResetPassword, setStaffToResetPassword] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Edit Staff Modal State (Store Owner / Super Admin Only)
  const [staffToEdit, setStaffToEdit] = useState<User | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // View Staff Details Dialog
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Delete Staff Dialog
  const [staffToDelete, setStaffToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaffAndRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const isArchived = statusFilter === 'DELETED';
      const [usersResponse, rolesData] = await Promise.all([
        userApi.getUsers({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          roleId: roleFilter === 'all' ? undefined : roleFilter,
          status: statusFilter === 'all' || isArchived ? undefined : statusFilter,
          deletedOnly: isArchived ? true : undefined,
          userType: 'staff',
        }),
        roleApi.getAll().catch(() => [] as Role[]),
      ]);

      setStaffList(usersResponse.users);
      setTotalPages(usersResponse.meta?.totalPages || 1);
      setTotalItems(usersResponse.meta?.totalItems || usersResponse.users.length);
      setRoles(rolesData);
    } catch (error) {
      toast.error('Failed to load staff members and roles');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStaffAndRoles();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStaffAndRoles]);

  // Hierarchy level of the current authenticated user (Style 1)
  const currentActorLevel = useMemo(() => {
    if (!currentUser) return 0;
    const emailLower = (currentUser.email || '').toLowerCase();
    if (emailLower === 'admin@yox.com') return 100;
    const roleObj = roles.find((r) => r.id === currentUser.roleId || r.name === currentUser.role);
    if (roleObj) {
      const roleName = roleObj.name.toUpperCase();
      if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || roleObj.permissions?.includes('*')) {
        return Math.max(roleObj.level ?? 100, 100);
      }
      return roleObj.level ?? (roleName === 'MANAGER' ? 75 : 50);
    }
    const roleUpper = (currentUser.role || '').toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') return 100;
    return 50;
  }, [currentUser, roles]);

  // Roles available for staff assignment (only roles with level strictly lower than current actor's level)
  const staffAssignableRoles = useMemo(() => {
    return roles.filter((r) => {
      const isCustomer = r.name.toUpperCase() === 'CUSTOMER';
      if (isCustomer) return false;
      if (isStoreOwner) return true;
      const rName = r.name.toUpperCase();
      let rLevel = r.level;
      if (rLevel === undefined || rLevel === 20) {
        if (rName === 'ADMIN' || rName === 'SUPER_ADMIN') rLevel = 100;
        else if (rName === 'MANAGER') rLevel = 75;
        else if (rName === 'EDITOR' || rName === 'SUPPORT') rLevel = 50;
      }
      if (rLevel === undefined) rLevel = 50;
      return currentActorLevel > rLevel;
    });
  }, [roles, currentActorLevel, isStoreOwner]);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewStaff((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
  };

  const generateResetPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordValue(pwd);
    setShowResetPassword(true);
  };

  const generateRandomPromotePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPromotePassword(pwd);
    setShowPromotePassword(true);
  };

  const resolveTargetLevel = (user: User | null | undefined, roleObj?: Role) => {
    if (!user && !roleObj) return 50;
    if (user && (user.email || '').toLowerCase() === 'admin@yox.com') return 100;
    const r = roleObj || (user?.roleId ? roles.find((role) => role.id === user.roleId) : undefined);
    const rName = (r?.name || user?.roleName || '').toUpperCase();
    let lvl = r?.level;
    if (lvl === undefined || lvl === 20) {
      if (rName === 'ADMIN' || rName === 'SUPER_ADMIN') lvl = 100;
      else if (rName === 'CUSTOMER') lvl = 0;
      else if (rName === 'MANAGER') lvl = 75;
      else if (rName === 'EDITOR' || rName === 'SUPPORT') lvl = 50;
    }
    return lvl !== undefined ? lvl : 50;
  };

  // Change staff member's role directly from the table
  const handleRoleChange = async (userId: string, newRoleId: string) => {
    if (!canManageStaff) {
      toast.error('You do not have permission to modify staff roles.');
      return;
    }
    const targetStaff = staffList.find((s) => s.id === userId);
    const isTargetOwner = (targetStaff?.email || '').toLowerCase() === 'admin@yox.com';
    if (isTargetOwner) {
      toast.error('The Store Owner role is permanently protected.');
      return;
    }
    const targetRole = roles.find((r) => r.id === targetStaff?.roleId);
    const targetLevel = resolveTargetLevel(targetStaff, targetRole);

    if (currentActorLevel <= targetLevel) {
      toast.error('You can only modify roles of staff with a strictly lower hierarchy rank than yours.');
      return;
    }

    const newRole = roles.find((r) => r.id === newRoleId);
    const newRoleLevel = resolveTargetLevel(null, newRole);

    if (currentActorLevel <= newRoleLevel) {
      toast.error('You cannot assign a role with a hierarchy rank equal to or higher than your own.');
      return;
    }
    try {
      setIsUpdating(userId);
      await userApi.updateRole(userId, newRoleId);
      toast.success('Staff role updated successfully');
      fetchStaffAndRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update staff role');
    } finally {
      setIsUpdating(null);
    }
  };

  // Toggle staff status between ACTIVE and SUSPENDED
  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    if (!canManageStaff) {
      toast.error('You do not have permission to change staff status.');
      return;
    }
    const targetStaff = staffList.find((s) => s.id === userId);
    const isTargetOwner = (targetStaff?.email || '').toLowerCase() === 'admin@yox.com';
    if (isTargetOwner) {
      toast.error('The Store Owner account is permanently protected and cannot be suspended.');
      return;
    }
    const targetRole = roles.find((r) => r.id === targetStaff?.roleId);
    const targetLevel = resolveTargetLevel(targetStaff, targetRole);

    if (currentActorLevel <= targetLevel) {
      toast.error('You can only change status for staff with a strictly lower hierarchy rank than yours.');
      return;
    }
    try {
      setIsUpdating(userId);
      await userApi.updateStatus(userId, newStatus);
      toast.success(
        newStatus === 'ACTIVE'
          ? 'Staff member account activated'
          : 'Staff member account suspended'
      );
      fetchStaffAndRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update staff status');
    } finally {
      setIsUpdating(null);
    }
  };

  // Restore an archived / soft-deleted staff member back to active
  const handleRestoreStaff = async (staff: User) => {
    if (!canManageStaff) {
      toast.error('You do not have permission to restore staff members.');
      return;
    }
    const targetRole = roles.find((r) => r.id === staff.roleId);
    const targetLevel = resolveTargetLevel(staff, targetRole);

    if (currentActorLevel <= targetLevel) {
      toast.error('You can only restore staff with a strictly lower hierarchy rank than yours.');
      return;
    }

    try {
      setIsUpdating(staff.id);
      await userApi.updateStatus(staff.id, 'ACTIVE');
      toast.success(`Staff member "${staff.fullName}" restored successfully as active staff.`);
      fetchStaffAndRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to restore staff member');
    } finally {
      setIsUpdating(null);
    }
  };

  // Check if entered email or phone matches an archived staff member (Mode 1 suggestion)
  useEffect(() => {
    if (addMode !== 'create' || !isAddOpen) {
      setArchivedSuggestion(null);
      return;
    }
    const cleanEmail = newStaff.email.trim();
    const cleanPhone = newStaff.phone.replace(/\D/g, '');
    if ((!cleanEmail || !cleanEmail.includes('@')) && cleanPhone.length < 10) {
      setArchivedSuggestion(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsCheckingArchived(true);
        const res = await userApi.getUsers({
          search: cleanEmail || cleanPhone,
          deletedOnly: true,
          limit: 3,
        });
        const match = res.users.find(
          (u) =>
            (cleanEmail && u.email?.toLowerCase() === cleanEmail.toLowerCase()) ||
            (cleanPhone.length === 10 && u.phone?.replace(/\D/g, '').endsWith(cleanPhone))
        );
        setArchivedSuggestion(match || null);
      } catch {
        setArchivedSuggestion(null);
      } finally {
        setIsCheckingArchived(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [newStaff.email, newStaff.phone, addMode, isAddOpen]);

  // Search existing customers to promote to staff (Mode 2)
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2 || !isAddOpen || addMode !== 'promote') {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const res = await userApi.getUsers({
          search: userSearchQuery.trim(),
          limit: 8,
          includeDeleted: true,
        });
        const candidates = res.users.filter((u) => {
          const r = roles.find((role) => role.id === u.roleId);
          return r?.name.toUpperCase() === 'CUSTOMER' || !u.roleId || Boolean(u.deletedAt);
        });
        setUserSearchResults(candidates);
      } catch (e) {
        setUserSearchResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery, isAddOpen, addMode, roles]);

  // Promote existing customer to staff
  const handlePromoteExistingUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff) {
      toast.error('You do not have permission to assign or promote staff roles.');
      return;
    }
    if (!selectedUserToPromote) {
      toast.error('Please select an existing user to promote');
      return;
    }
    if (!promoteRoleId) {
      toast.error('Please select a staff role to assign');
      return;
    }

    try {
      setIsPromoting(true);

      const extraData: { email?: string; password?: string } = {};
      if (promoteEmail.trim() && promoteEmail.trim().toLowerCase() !== selectedUserToPromote.email?.toLowerCase()) {
        extraData.email = promoteEmail.trim().toLowerCase();
      }
      if (promotePassword.trim()) {
        extraData.password = promotePassword.trim();
      }

      await userApi.updateRole(selectedUserToPromote.id, promoteRoleId, extraData);

      const assignedRole = roles.find((r) => r.id === promoteRoleId);
      toast.success(
        `Added "${selectedUserToPromote.fullName}" (${promoteEmail || selectedUserToPromote.email}) as ${assignedRole?.name || 'Staff'}`
      );

      setIsAddOpen(false);
      setSelectedUserToPromote(null);
      setUserSearchQuery('');
      setPromoteRoleId('');
      setPromoteEmail('');
      setPromotePassword('');
      fetchStaffAndRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to assign staff role');
    } finally {
      setIsPromoting(false);
    }
  };

  // Create brand new staff member account
  const handleCreateNewStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStaff) {
      toast.error('You do not have permission to create staff members.');
      return;
    }

    if (!newStaff.fullName.trim() || !newStaff.email.trim() || !newStaff.password) {
      toast.error('Please enter name, official work email, and temporary password');
      return;
    }
    const cleanPhone = newStaff.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('A valid 10-digit contact mobile phone number is required');
      return;
    }
    if (!newStaff.roleId) {
      toast.error('Please assign a role for the new staff member');
      return;
    }

    try {
      setIsCreating(true);
      await userApi.createUser({
        fullName: newStaff.fullName.trim(),
        email: newStaff.email.trim(),
        phone: cleanPhone,
        password: newStaff.password,
        roleId: newStaff.roleId,
      });

      toast.success(`Staff member "${newStaff.fullName}" created successfully`);
      setIsAddOpen(false);
      setNewStaff({ fullName: '', email: '', phone: '', password: '', roleId: '' });
      fetchStaffAndRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create staff member');
    } finally {
      setIsCreating(false);
    }
  };

  // Reset staff password
  const handleResetStaffPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToResetPassword || !resetPasswordValue.trim()) return;

    if (!canManageStaff) {
      toast.error('You do not have permission to reset staff passwords.');
      return;
    }

    const isTargetOwner = (staffToResetPassword.email || '').toLowerCase() === 'admin@yox.com';
    if (isTargetOwner) {
      toast.error('The Store Owner password cannot be reset from this interface.');
      return;
    }

    const targetRole = roles.find((r) => r.id === staffToResetPassword.roleId);
    const targetLevel = resolveTargetLevel(staffToResetPassword, targetRole);

    if (currentActorLevel <= targetLevel) {
      toast.error('You can only reset passwords for staff with a strictly lower hierarchy rank than yours.');
      return;
    }

    if (resetPasswordValue.trim().length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsResettingPassword(true);
      await userApi.resetPassword(staffToResetPassword.id, resetPasswordValue.trim());
      toast.success(`Password reset successfully for ${staffToResetPassword.fullName}`);
      setStaffToResetPassword(null);
      setResetPasswordValue('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Open Edit Staff Modal
  const handleOpenEdit = (staff: User) => {
    if (!canManageStaff) {
      toast.error('You do not have permission to modify staff credentials.');
      return;
    }
    const isTargetOwner = (staff.email || '').toLowerCase() === 'admin@yox.com';
    if (isTargetOwner) {
      toast.error('The Store Owner account is protected and cannot be edited here.');
      return;
    }
    const targetRole = roles.find((r) => r.id === staff.roleId);
    const targetLevel = resolveTargetLevel(staff, targetRole);

    if (currentActorLevel <= targetLevel) {
      toast.error('You can only edit staff with a strictly lower hierarchy rank than yours.');
      return;
    }
    setStaffToEdit(staff);
    setEditStaffForm({
      fullName: staff.fullName || '',
      email: staff.email || '',
      phone: staff.phone ? staff.phone.replace(/\D/g, '') : '',
      roleId: staff.roleId || '',
    });
  };

  // Save edited staff credentials
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToEdit) return;

    const cleanName = editStaffForm.fullName.trim();
    const cleanEmail = editStaffForm.email.trim().toLowerCase();
    const cleanPhone = editStaffForm.phone.replace(/\D/g, '');

    if (!cleanName) {
      toast.error('Full name is required');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('A valid official work email is required');
      return;
    }
    if (cleanPhone.length !== 10) {
      toast.error('A valid 10-digit contact phone number is required');
      return;
    }
    if (!editStaffForm.roleId) {
      toast.error('Please select an assigned staff role');
      return;
    }

    try {
      setIsSavingEdit(true);
      const updatePayload: { fullName: string; roleId: string; email?: string; phone?: string } = {
        fullName: cleanName,
        roleId: editStaffForm.roleId,
      };
      if (isStoreOwner) {
        updatePayload.email = cleanEmail;
        updatePayload.phone = cleanPhone;
      }
      await userApi.updateStaff(staffToEdit.id, updatePayload);
      toast.success(`Staff credentials for ${cleanName} updated successfully`);
      setStaffToEdit(null);
      fetchStaffAndRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update staff credentials');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    if (!canManageStaff) {
      toast.error('You do not have permission to delete staff members.');
      setStaffToDelete(null);
      return;
    }

    const isTargetOwner = (staffToDelete.email || '').toLowerCase() === 'admin@yox.com';
    if (isTargetOwner) {
      toast.error('The Store Owner account is permanently protected and cannot be deleted.');
      setStaffToDelete(null);
      return;
    }

    if (currentUser && staffToDelete.id === currentUser.id) {
      toast.error('You cannot delete your own active administrator account.');
      setStaffToDelete(null);
      return;
    }

    const targetRole = roles.find((r) => r.id === staffToDelete.roleId);
    const targetLevel = resolveTargetLevel(staffToDelete, targetRole);

    if (currentActorLevel <= targetLevel) {
      toast.error('You can only delete staff with a strictly lower hierarchy rank than yours.');
      setStaffToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      await userApi.deleteUser(staffToDelete.id);
      toast.success(`Staff member "${staffToDelete.fullName}" has been removed and archived.`);
      setStaffToDelete(null);
      fetchStaffAndRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete staff member');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const activeStaffCount = useMemo(
    () => staffList.filter((s) => (s.status || 'ACTIVE') === 'ACTIVE' && !s.deletedAt).length,
    [staffList]
  );
  const adminManagerCount = useMemo(
    () =>
      staffList.filter((s) => {
        const rName = (s.roleName || '').toUpperCase();
        return rName === 'ADMIN' || rName === 'MANAGER';
      }).length,
    [staffList]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Staff Members</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Internal Team
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your store management team, assign role permissions, and control internal administrative privileges
          </p>
        </div>

        {canManageStaff && (
          <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Staff Member
          </Button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <UserCog className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Team members with backend access</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeStaffCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Authorized and currently active</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins & Managers</CardTitle>
            <Shield className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {adminManagerCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Elevated management authority</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Roles</CardTitle>
            <KeyRound className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {staffAssignableRoles.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Roles configured for staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-background/50 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val || 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {staffAssignableRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[155px] h-9 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Active Staff</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DELETED">Archived / Removed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Mobile / Small Screens: Modern Responsive Card Boxes                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 md:hidden">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 border bg-card/60 backdrop-blur-sm animate-pulse space-y-3 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-36 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-8 w-8 rounded bg-muted" />
              </div>
              <div className="h-8 bg-muted rounded-md" />
            </Card>
          ))
        ) : staffList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border p-6">
            <UserCog className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <span className="font-medium text-base block">No staff members found</span>
            <span className="text-xs">
              {searchQuery ? `No staff match "${searchQuery}".` : 'Click "+ Add Staff Member" to add a team member.'}
            </span>
          </div>
        ) : (
          staffList.map((staff) => {
            const status = staff.status || 'ACTIVE';
            const roleObj = roles.find((r) => r.id === staff.roleId);
            const roleName = roleObj?.name || staff.roleName || 'Custom';
            const isTargetStoreOwner = (staff.email || '').toLowerCase() === 'admin@yox.com';
            const isCurrentLoggedInUser = Boolean(currentUser?.id && staff.id === currentUser.id);
            const targetLevel = resolveTargetLevel(staff, roleObj);

            const canModifyThisStaff =
              canManageStaff &&
              !isTargetStoreOwner &&
              !isCurrentLoggedInUser &&
              currentActorLevel > targetLevel;

            const initials = staff.fullName
              ? staff.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
              : 'ST';

            const permissionsCount = roleObj?.permissions?.includes('*')
              ? 'All Permissions (*)'
              : `${roleObj?.permissions?.length || 0} perms`;

            return (
              <Card
                key={staff.id}
                className="p-4 border bg-card hover:border-primary/30 transition-all shadow-xs rounded-xl flex flex-col justify-between gap-3.5"
              >
                {/* Top Bar: Avatar, Info, Badges, and Action Buttons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {staff.fullName}
                        </span>
                        {isTargetStoreOwner && (
                          <Badge className="text-[9px] py-0 px-1.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200">
                            Store Owner
                          </Badge>
                        )}
                        {isCurrentLoggedInUser && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 bg-primary/10 text-primary border-primary/20">
                            You
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                        <Mail className="h-3 w-3 shrink-0" /> {staff.email}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Primary View in front + Three-Dot Dropdown Menu) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
                      title="View staff details"
                      onClick={() => {
                        setSelectedStaff(staff);
                        setIsViewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {staff.deletedAt ? (
                      canModifyThisStaff && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreStaff(staff)}
                          disabled={isUpdating === staff.id}
                          className="h-8 px-2 text-xs font-semibold gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                          title="Restore this archived staff member to active"
                        >
                          {isUpdating === staff.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5" />
                          )}
                          <span>Restore</span>
                        </Button>
                      )
                    ) : canModifyThisStaff ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className={buttonVariants({
                            variant: 'ghost',
                            className: 'h-8 w-8 p-0 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted',
                          })}
                          title="More options"
                        >
                          <span className="sr-only">More options</span>
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-lg border bg-popover text-popover-foreground">
                          <DropdownMenuItem
                            onClick={() => handleOpenEdit(staff)}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5 text-primary" />
                            <span>Edit Credentials & Role</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setStaffToResetPassword(staff);
                              setResetPasswordValue('');
                              setShowResetPassword(false);
                            }}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                            <span>Reset Password</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleStatusChange(staff.id, status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            disabled={isUpdating === staff.id}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
                          >
                            {status === 'ACTIVE' ? (
                              <>
                                <Ban className="h-3.5 w-3.5 text-amber-600" />
                                <span>Suspend Staff Account</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Activate Staff Account</span>
                              </>
                            )}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator className="my-1 -mx-1" />

                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setStaffToDelete(staff)}
                            className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Remove Staff Member</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : isTargetStoreOwner ? (
                      <div
                        className="h-8 w-8 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                        title="Store Owner account is permanently protected"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    ) : isCurrentLoggedInUser ? (
                      <div
                        className="h-8 w-8 flex items-center justify-center text-muted-foreground/40"
                        title="Your account credentials can be managed in My Account settings"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <div
                        className="h-8 w-8 flex items-center justify-center text-muted-foreground/40"
                        title="Higher or equal hierarchy rank - read only"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Meta Info */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                  {/* Role */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Role</span>
                    {canModifyThisStaff ? (
                      <Select
                        value={staff.roleId}
                        disabled={Boolean(isUpdating === staff.id)}
                        onValueChange={(newRoleId) => newRoleId && handleRoleChange(staff.id, newRoleId)}
                      >
                        <SelectTrigger className="h-7 text-xs font-semibold w-full">
                          <SelectValue placeholder="Select role">
                            <span className="flex items-center gap-1 truncate">
                              {roleName === 'ADMIN' ? (
                                <Shield className="h-3 w-3 text-indigo-600" />
                              ) : (
                                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                              )}
                              {roleName}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {staffAssignableRoles.map((r) => (
                            <SelectItem key={r.id} value={r.id} className="text-xs">
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/60 border text-xs font-semibold text-foreground w-fit">
                        {isTargetStoreOwner || roleName === 'ADMIN' ? (
                          <Shield className="h-3 w-3 text-indigo-600" />
                        ) : (
                          <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        )}
                        <span>{roleName}</span>
                        {isTargetStoreOwner && (
                          <span title="Store Owner role is permanently protected" className="inline-flex items-center ml-0.5">
                            <Lock className="h-2.5 w-2.5 text-indigo-500" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Status</span>
                    <div>
                      {staff.deletedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 px-2 py-0.5 text-[11px] font-medium">
                          <Archive className="h-3 w-3" /> Archived
                        </span>
                      ) : status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 text-[11px] font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[11px] font-medium">
                          <Ban className="h-3 w-3" /> Suspended
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Scope</span>
                    <div className="flex items-center gap-1 text-muted-foreground truncate">
                      {roleName === 'ADMIN' ? (
                        <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 text-[10px] px-1.5 py-0">
                          Full Access
                        </Badge>
                      ) : (
                        <span className="text-[11px] font-medium flex items-center gap-1">
                          <KeyRound className="h-3 w-3 text-primary" /> {permissionsCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Joined Date */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider block">Joined</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {staff.createdAt
                        ? new Date(staff.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : '-'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* Desktop / Large Screens: Modern Staff Table                               */}
      {/* ========================================================================= */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[30%]">Team Member</TableHead>
              <TableHead className="w-[20%]">Assigned Role</TableHead>
              <TableHead className="w-[20%]">Permissions Scope</TableHead>
              <TableHead className="w-[12%]">Status</TableHead>
              <TableHead className="w-[10%]">Joined Date</TableHead>
              <TableHead className="text-right w-[8%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-muted rounded-md" />
                          <div className="h-3 w-40 bg-muted rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-7 w-32 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-24 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-16 bg-muted rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <div className="h-8 w-8 rounded-md bg-muted" />
                        <div className="h-8 w-8 rounded-md bg-muted" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : staffList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCog className="h-8 w-8 text-muted-foreground/50" />
                    <span className="font-medium text-base">No staff members found</span>
                    <span className="text-xs">
                      {searchQuery
                        ? `No staff match "${searchQuery}".`
                        : 'Click "+ Add Staff Member" to add or promote a team member.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staffList.map((staff) => {
                const status = staff.status || 'ACTIVE';
                const roleObj = roles.find((r) => r.id === staff.roleId);
                const roleName = roleObj?.name || staff.roleName || 'Custom';
                const isTargetStoreOwner = (staff.email || '').toLowerCase() === 'admin@yox.com';
                const isCurrentLoggedInUser = Boolean(currentUser?.id && staff.id === currentUser.id);
                const targetLevel = resolveTargetLevel(staff, roleObj);

                const canModifyThisStaff =
                  canManageStaff &&
                  !isTargetStoreOwner &&
                  !isCurrentLoggedInUser &&
                  currentActorLevel > targetLevel;

                const initials = staff.fullName
                  ? staff.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  : 'ST';

                const permissionsCount = roleObj?.permissions?.includes('*')
                  ? 'All Permissions (*)'
                  : `${roleObj?.permissions?.length || 0} permissions`;

                return (
                  <TableRow key={staff.id} className="hover:bg-muted/30 transition-colors">
                    {/* Staff Name & Email */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground truncate">
                            <span>{staff.fullName}</span>
                            {isTargetStoreOwner && (
                              <Badge className="text-[10px] py-0 px-1.5 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200">
                                Store Owner
                              </Badge>
                            )}
                            {isCurrentLoggedInUser && (
                              <Badge variant="outline" className="text-[10px] py-0 px-1 bg-primary/10 text-primary border-primary/20">
                                You
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                            <Mail className="h-3 w-3 shrink-0" /> {staff.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Assigned Role */}
                    <TableCell>
                      {canModifyThisStaff ? (
                        <div className="w-[160px]">
                          <Select
                            value={staff.roleId}
                            disabled={Boolean(isUpdating === staff.id)}
                            onValueChange={(newRoleId) => newRoleId && handleRoleChange(staff.id, newRoleId)}
                          >
                            <SelectTrigger className="h-8 text-xs font-semibold">
                              <SelectValue placeholder="Select role">
                                <span className="flex items-center gap-1.5 truncate">
                                  {roleName === 'ADMIN' ? (
                                    <Shield className="h-3 w-3 text-indigo-600" />
                                  ) : (
                                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  )}
                                  {roleName}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {staffAssignableRoles.map((r) => (
                                <SelectItem key={r.id} value={r.id} className="text-xs">
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border text-xs font-semibold text-foreground w-fit">
                          {isTargetStoreOwner || roleName === 'ADMIN' ? (
                            <Shield className="h-3.5 w-3.5 text-indigo-600" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          <span>{roleName}</span>
                          {isTargetStoreOwner && (
                            <span title="Store Owner role is permanently protected" className="inline-flex items-center ml-1">
                              <Lock className="h-3 w-3 text-indigo-500" />
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Permissions Scope */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {roleName === 'ADMIN' ? (
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 text-xs">
                            Full Store Access
                          </Badge>
                        ) : roleObj?.permissions && roleObj.permissions.length > 0 ? (
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <KeyRound className="h-3.5 w-3.5 text-primary" />
                            {permissionsCount}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No permissions configured
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {staff.deletedAt ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 px-2.5 py-0.5 text-xs font-medium">
                          <Archive className="h-3 w-3" /> Archived
                        </span>
                      ) : status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-2.5 py-0.5 text-xs font-medium">
                          <Ban className="h-3 w-3" /> Suspended
                        </span>
                      )}
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {staff.createdAt
                            ? new Date(staff.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                            : '-'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Actions: Primary View in front + Three-Dot Dropdown Menu / Restore */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Primary Action (In Front): View Staff Info */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-muted"
                          title="View staff details"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* If staff is archived (soft-deleted), offer Restore button */}
                        {staff.deletedAt ? (
                          canModifyThisStaff && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestoreStaff(staff)}
                              disabled={isUpdating === staff.id}
                              className="h-8 px-2.5 text-xs font-semibold gap-1.5 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                              title="Restore this archived staff member to active"
                            >
                              {isUpdating === staff.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )}
                              <span>Restore</span>
                            </Button>
                          )
                        ) : canModifyThisStaff ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className={buttonVariants({
                                variant: 'ghost',
                                className: 'h-8 w-8 p-0 cursor-pointer rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted',
                              })}
                              title="More options"
                            >
                              <span className="sr-only">More options</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl shadow-lg border bg-popover text-popover-foreground">
                              <DropdownMenuItem
                                onClick={() => handleOpenEdit(staff)}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5 text-primary" />
                                <span>Edit Credentials & Role</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => {
                                  setStaffToResetPassword(staff);
                                  setResetPasswordValue('');
                                  setShowResetPassword(false);
                                }}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
                              >
                                <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                                <span>Reset Password</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => handleStatusChange(staff.id, status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                disabled={isUpdating === staff.id}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg focus:bg-accent focus:text-accent-foreground"
                              >
                                {status === 'ACTIVE' ? (
                                  <>
                                    <Ban className="h-3.5 w-3.5 text-amber-600" />
                                    <span>Suspend Staff Account</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Activate Staff Account</span>
                                  </>
                                )}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 -mx-1" />

                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setStaffToDelete(staff)}
                                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove Staff Member</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : isTargetStoreOwner ? (
                          <div
                            className="h-8 w-8 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                            title="Store Owner account is permanently protected"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : isCurrentLoggedInUser ? (
                          <div
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground/40 cursor-default"
                            title="Your account credentials can be managed in My Account settings"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <div
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground/40 cursor-default"
                            title="Higher or equal hierarchy rank - read only"
                          >
                            <Lock className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing page {currentPage} of {totalPages} ({totalItems} staff)
            </span>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Mobile Pagination */}
      {totalPages > 1 && (
        <div className="p-4 bg-card rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs md:hidden">
          <span className="text-xs text-muted-foreground">
            Showing page {currentPage} of {totalPages} ({totalItems} staff)
          </span>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* Add Staff Member Modal Dialog (Create New or Promote Existing)             */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[580px] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl gap-0">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Add Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register a new staff member with work credentials or assign backend permissions to an existing user
            </DialogDescription>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-medium mt-3">
              <button
                type="button"
                onClick={() => setAddMode('create')}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${addMode === 'create'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                New Staff Account
              </button>
              <button
                type="button"
                onClick={() => setAddMode('promote')}
                className={`flex-1 py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${addMode === 'promote'
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <UserSearch className="h-3.5 w-3.5" />
                Promote Existing User
              </button>
            </div>
          </DialogHeader>

          {addMode === 'create' ? (
            /* ========================================== */
            /* MODE 1: Create Brand New Staff Account     */
            /* ========================================== */
            <form onSubmit={handleCreateNewStaff} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* 2-Column Grid: Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="staff-name" className="text-xs font-semibold text-foreground">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="staff-name"
                      placeholder="e.g. Sarah Jenkins"
                      value={newStaff.fullName}
                      onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                      required
                      className="h-9.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="staff-phone" className="text-xs font-semibold text-foreground">
                      Contact Phone <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                        +91
                      </span>
                      <Input
                        id="staff-phone"
                        type="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        value={newStaff.phone}
                        onChange={(e) =>
                          setNewStaff({
                            ...newStaff,
                            phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                          })
                        }
                        required
                        className="h-9.5 text-sm pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* 2-Column Grid: Work Email & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="staff-email" className="text-xs font-semibold text-foreground">
                        Official Work Email <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[10px] text-muted-foreground">For Admin Login</span>
                    </div>
                    <Input
                      id="staff-email"
                      type="email"
                      placeholder="e.g. sarah@yox.com"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      required
                      className="h-9.5 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Assigned Staff Role <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={newStaff.roleId}
                      onValueChange={(val) => setNewStaff({ ...newStaff, roleId: val || '' })}
                    >
                      <SelectTrigger className="w-full h-9.5 text-xs">
                        <SelectValue placeholder="Select access role...">
                          {staffAssignableRoles.find((r) => r.id === newStaff.roleId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {staffAssignableRoles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center justify-between gap-4 font-medium py-0.5">
                              <span>{r.name}</span>
                              <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {r.permissions.length} perms
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="staff-password" className="text-xs font-semibold text-foreground">
                      Initial Password <span className="text-destructive">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={generateRandomPassword}
                      className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary font-medium cursor-pointer"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-primary" /> Auto-generate
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="staff-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      required
                      className="h-9.5 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Staff members sign in to the Admin Dashboard using this work email and password.
                  </p>
                </div>

                {/* Archived Staff Member Suggestion */}
                {archivedSuggestion && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                        <span>Archived Staff Member Found</span>
                        <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 font-semibold">
                          Soft-Deleted History
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                        An archived record for <strong className="text-foreground">{archivedSuggestion.fullName}</strong> ({archivedSuggestion.email || archivedSuggestion.phone}) exists in the database.
                        Submitting will restore and reactivate their account with all previous logs, past orders, and audit trail intact.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewStaff((prev) => ({
                            ...prev,
                            fullName: archivedSuggestion.fullName || prev.fullName,
                            phone: archivedSuggestion.phone ? archivedSuggestion.phone.replace(/\D/g, '').slice(-10) : prev.phone,
                            roleId: archivedSuggestion.roleId || prev.roleId,
                          }));
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold underline hover:no-underline cursor-pointer"
                      >
                        <UserCheck className="h-3 w-3" /> Autofill {archivedSuggestion.fullName}&apos;s saved profile
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="h-9 px-4.5 text-xs font-medium gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white shadow-xs cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {archivedSuggestion ? 'Restoring Staff...' : 'Creating Staff...'}
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      {archivedSuggestion ? 'Restore & Activate Staff' : 'Create Staff Member'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            /* ========================================== */
            /* MODE 2: Search & Promote Existing User     */
            /* ========================================== */
            <form onSubmit={handlePromoteExistingUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="user-email-search" className="text-xs font-semibold text-foreground">
                    Search Registered User by Name, Phone, or Email <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-email-search"
                      placeholder="Type name, phone number, or email..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                        if (selectedUserToPromote) setSelectedUserToPromote(null);
                      }}
                      className="pl-9 h-9.5 text-sm"
                    />
                    {isSearchingUsers && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Search Results Dropdown List */}
                {userSearchResults.length > 0 && !selectedUserToPromote && (
                  <div className="rounded-lg border bg-popover shadow-md overflow-hidden max-h-[170px] overflow-y-auto">
                    <div className="p-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/40 border-b">
                      Matching Users ({userSearchResults.length}) - Click to select
                    </div>
                    {userSearchResults.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setSelectedUserToPromote(u);
                          setUserSearchQuery(u.email || u.phone || u.fullName);
                          setPromoteEmail(u.email || '');
                          if (u.roleId) setPromoteRoleId(u.roleId);
                          setPromotePassword('');
                          setUserSearchResults([]);
                        }}
                        className="p-2.5 hover:bg-muted/60 cursor-pointer transition-colors flex items-center justify-between border-b last:border-0"
                      >
                        <div>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {u.deletedAt && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                (Archived)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            {u.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {u.email}
                              </span>
                            )}
                            {u.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> +91 {u.phone}
                              </span>
                            )}
                            {!u.email && !u.phone && <span>Registered User</span>}
                          </div>
                        </div>
                        {u.deletedAt ? (
                          <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40">
                            Archived Staff
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {u.roleName || 'Customer'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected User Display Card */}
                {selectedUserToPromote && (
                  <div className="p-3 rounded-lg border bg-primary/5 border-primary/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Selected User
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUserToPromote(null);
                          setUserSearchQuery('');
                          setPromoteEmail('');
                          setPromotePassword('');
                        }}
                        className="h-5 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Change
                      </Button>
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      {selectedUserToPromote.fullName}
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                      {selectedUserToPromote.email && (
                        <span>Email: <strong className="text-foreground">{selectedUserToPromote.email}</strong></span>
                      )}
                      {selectedUserToPromote.phone && (
                        <span>Phone: <strong className="text-foreground">+91 {selectedUserToPromote.phone}</strong></span>
                      )}
                    </div>
                  </div>
                )}

                {/* Work Email and Role in 2 Columns when selected */}
                {selectedUserToPromote && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="promote-email" className="text-xs font-semibold text-foreground">
                          Staff Work Email <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[10px] text-muted-foreground">For /admin-login</span>
                      </div>
                      <Input
                        id="promote-email"
                        type="email"
                        placeholder="e.g. employee@yox.com"
                        value={promoteEmail}
                        onChange={(e) => setPromoteEmail(e.target.value)}
                        required
                        className="h-9.5 text-sm"
                      />
                      {!selectedUserToPromote.email && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          User registered via phone. Enter work email for admin dashboard.
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Assign Staff Role <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={promoteRoleId}
                        onValueChange={(val) => setPromoteRoleId(val || '')}
                      >
                        <SelectTrigger className="w-full h-9.5 text-xs">
                          <SelectValue placeholder="Select staff role...">
                            {staffAssignableRoles.find((r) => r.id === promoteRoleId)?.name}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {staffAssignableRoles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="flex items-center justify-between gap-4 font-medium py-0.5">
                                <span>{r.name}</span>
                                <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                  {r.permissions.length} perms
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Set Staff Password */}
                {selectedUserToPromote && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="promote-password" className="text-xs font-semibold text-foreground">
                        Set Initial Password <span className="text-destructive">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateRandomPromotePassword}
                        className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary font-medium cursor-pointer"
                      >
                        <KeyRound className="h-3.5 w-3.5 text-primary" /> Auto-generate
                      </Button>
                    </div>
                    <div className="relative">
                      <Input
                        id="promote-password"
                        type={showPromotePassword ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={promotePassword}
                        onChange={(e) => setPromotePassword(e.target.value)}
                        required
                        className="h-9.5 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPromotePassword(!showPromotePassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                        title={showPromotePassword ? 'Hide password' : 'Show password'}
                      >
                        {showPromotePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Staff members use this password to sign into the Admin Dashboard at /admin-login.
                    </p>
                  </div>
                )}

                {!selectedUserToPromote && (
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-semibold text-foreground">
                      Assign Staff Role / Privileges <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={promoteRoleId}
                      onValueChange={(val) => setPromoteRoleId(val || '')}
                    >
                      <SelectTrigger className="w-full h-9.5 text-xs">
                        <SelectValue placeholder="Choose staff role (e.g. MANAGER, SUPPORT)...">
                          {staffAssignableRoles.find((r) => r.id === promoteRoleId)?.name}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {staffAssignableRoles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center justify-between gap-4 font-medium py-0.5">
                              <span>{r.name}</span>
                              <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {r.permissions.length} perms
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPromoting || !selectedUserToPromote || !promoteRoleId}
                  className="h-9 px-4.5 text-xs font-medium gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white shadow-xs cursor-pointer"
                >
                  {isPromoting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Assigning Staff...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Promote User to Staff
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Edit Staff Member Dialog (Store Owner / Super Admin Only)                 */}
      {/* ========================================================================= */}
      <Dialog
        open={!!staffToEdit}
        onOpenChange={(open) => {
          if (!open) {
            setStaffToEdit(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[540px] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl gap-0">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                <UserCog className="h-5 w-5 text-primary" />
                Edit Staff Member
              </DialogTitle>
              <Badge variant="outline" className="text-[11px] bg-primary/5 text-primary border-primary/20 gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                {isStoreOwner ? 'Store Owner Access' : 'Staff Manager'}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Update official work email, contact phone, or assigned role for{' '}
              <strong className="text-foreground">{staffToEdit?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-staff-name" className="text-xs font-semibold text-foreground">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-staff-name"
                  placeholder="e.g. Sarah Jenkins"
                  value={editStaffForm.fullName}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, fullName: e.target.value })}
                  required
                  className="h-9.5 text-sm"
                />
              </div>

              {/* Two Column Grid for Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Official Work Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-staff-email" className="text-xs font-semibold text-foreground">
                    Official Work Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-staff-email"
                    type="email"
                    placeholder="staff@yox.com"
                    value={editStaffForm.email}
                    disabled={!isStoreOwner}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                    required
                    className="h-9.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {!isStoreOwner ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      Login email can only be modified by the Store Owner.
                    </p>
                  ) : (
                    <p className="text-[10.5px] text-muted-foreground">
                      Staff sign-in username for Admin Dashboard.
                    </p>
                  )}
                </div>

                {/* Contact Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-staff-phone" className="text-xs font-semibold text-foreground">
                    Contact Phone <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
                      +91
                    </span>
                    <Input
                      id="edit-staff-phone"
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      value={editStaffForm.phone}
                      disabled={!isStoreOwner}
                      onChange={(e) =>
                        setEditStaffForm({
                          ...editStaffForm,
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                        })
                      }
                      required
                      className="h-9.5 text-sm pl-10 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                  {!isStoreOwner ? (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      OTP reset phone number can only be modified by the Store Owner.
                    </p>
                  ) : (
                    <p className="text-[10.5px] text-muted-foreground">
                      Used for SMS OTP password reset.
                    </p>
                  )}
                </div>
              </div>

              {/* Assigned Staff Role */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-staff-role" className="text-xs font-semibold text-foreground">
                  Assigned Staff Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={editStaffForm.roleId}
                  onValueChange={(val) => setEditStaffForm({ ...editStaffForm, roleId: val || '' })}
                >
                  <SelectTrigger className="w-full h-9.5 text-xs">
                    <SelectValue placeholder="Select access role...">
                      {staffAssignableRoles.find((r) => r.id === editStaffForm.roleId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {staffAssignableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center justify-between gap-4 font-medium py-0.5">
                          <span>{r.name}</span>
                          <span className="text-muted-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded">
                            {r.permissions.length} perms
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Security Note:</strong> Changing official work credentials will require the staff member to log in using their new credentials. If phone is updated, OTP resets will be delivered to the new number.
                </span>
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStaffToEdit(null)}
                className="h-9 px-4 text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingEdit}
                className="h-9 px-4.5 text-xs font-medium gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white shadow-xs cursor-pointer"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Staff Details & Permissions Inspector Modal */}
      {/* ========================================================================= */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[520px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl gap-0">
          {selectedStaff && (
            <>
              <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {selectedStaff.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">
                      {selectedStaff.fullName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Staff ID: {selectedStaff.id}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
                  <div>
                    <span className="text-xs text-muted-foreground block">Email</span>
                    <span className="font-medium break-all">{selectedStaff.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Current Role</span>
                    <span className="font-semibold text-primary">
                      {roles.find((r) => r.id === selectedStaff.roleId)?.name ||
                        selectedStaff.roleName ||
                        'Staff'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Account Status</span>
                    <span className="font-medium">{selectedStaff.status || 'ACTIVE'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Contact Phone</span>
                    <span className="font-medium">
                      {selectedStaff.phone ? `+91 ${selectedStaff.phone}` : 'Not set'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-muted-foreground block">Added to Team</span>
                    <span className="font-medium">
                      {selectedStaff.createdAt
                        ? new Date(selectedStaff.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Permissions Breakdown */}
                {(() => {
                  const roleObj = roles.find((r) => r.id === selectedStaff.roleId);
                  const isWildcard = roleObj?.permissions.includes('*');

                  return (
                    <div className="space-y-2 p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5 text-primary" /> Active Permissions
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {isWildcard
                            ? 'Universal Access (*)'
                            : `${roleObj?.permissions?.length || 0} granted`}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1 max-h-[140px] overflow-y-auto">
                        {isWildcard ? (
                          <Badge className="bg-indigo-600 text-white text-xs">
                            Unrestricted Super Admin
                          </Badge>
                        ) : roleObj?.permissions && roleObj.permissions.length > 0 ? (
                          roleObj.permissions.map((p) => (
                            <span
                              key={p}
                              className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted text-foreground border"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No permissions mapped to this role.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end rounded-b-2xl">
                <Button
                  variant="outline"
                  onClick={() => setIsViewOpen(false)}
                  className="h-9 px-4 text-xs font-medium cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Reset Staff Password Modal Dialog                                         */}
      {/* ========================================================================= */}
      <Dialog
        open={!!staffToResetPassword}
        onOpenChange={(open) => {
          if (!open) {
            setStaffToResetPassword(null);
            setResetPasswordValue('');
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:max-w-[460px] max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl gap-0">
          <DialogHeader className="p-5 pb-3 border-b bg-card shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <KeyRound className="h-5 w-5 text-primary" />
              Reset Staff Password
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set a new temporary password for{' '}
              <strong className="text-foreground">{staffToResetPassword?.fullName}</strong> ({staffToResetPassword?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetStaffPassword} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="reset-staff-pwd" className="text-xs font-semibold text-foreground">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateResetPassword}
                    className="h-6 px-2 text-[11px] gap-1 text-primary hover:text-primary font-medium cursor-pointer"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-primary" /> Auto-generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="reset-staff-pwd"
                    type={showResetPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    required
                    className="h-9.5 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                    title={showResetPassword ? 'Hide password' : 'Show password'}
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The staff member will use this new password immediately to log into /admin-login.
                </p>
              </div>
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 rounded-b-2xl">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStaffToResetPassword(null);
                  setResetPasswordValue('');
                }}
                disabled={isResettingPassword}
                className="h-9 px-4 text-xs font-medium cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isResettingPassword || !resetPasswordValue.trim()}
                className="h-9 px-4.5 text-xs font-medium gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white shadow-xs cursor-pointer"
              >
                {isResettingPassword ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Save New Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Delete Confirmation Dialog */}
      {/* ========================================================================= */}
      <Dialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <DialogContent className="w-[95vw] sm:max-w-[460px] rounded-2xl border bg-card shadow-2xl p-6">
          <DialogHeader className="gap-2">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-destructive">
                  Remove Staff Member
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Revoke internal access and soft-delete from active staff directory
                </DialogDescription>
              </div>
            </div>
            <p className="text-xs text-foreground/90 pt-1 leading-normal">
              Are you sure you want to remove staff member{' '}
              <strong className="text-foreground">{staffToDelete?.fullName}</strong> ({staffToDelete?.email})?
            </p>
          </DialogHeader>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 space-y-1.5 my-1">
            <div className="text-xs font-semibold text-destructive flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Soft-Delete & Audit Integrity Policy</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This staff member will immediately lose backend admin login privileges and will be removed from the active staff directory. Their historical order handling, inventory modifications, and audit logs are securely retained in the database.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 flex flex-row items-center justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStaffToDelete(null)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="cursor-pointer gap-1.5 font-semibold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" /> Confirm Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
