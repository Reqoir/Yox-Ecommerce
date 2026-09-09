'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { userApi, User } from '@/api/admin/users';
import { roleApi, Role } from '@/api/admin/roles';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Eye,
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
  Calendar,
  Lock,
  X,
  KeyRound,
  Layers,
  Sparkles,
  Check,
  UserPlus,
  ArrowRight,
  UserSearch,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';

export default function StaffManagementPage() {
  const { user: currentUser } = useAuthStore();
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
  const [addMode, setAddMode] = useState<'promote' | 'create'>('promote');

  // Mode 1: Search & Promote Existing User
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState<User | null>(null);
  const [promoteRoleId, setPromoteRoleId] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  // Mode 2: Create Brand New Staff
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // View Staff Details Dialog
  const [selectedStaff, setSelectedStaff] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Delete Staff Dialog
  const [staffToDelete, setStaffToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaffAndRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResponse, rolesData] = await Promise.all([
        userApi.getUsers({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          roleId: roleFilter === 'all' ? undefined : roleFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
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

  // Search existing users dynamically as user types email/name
  useEffect(() => {
    if (!userSearchQuery.trim() || userSearchQuery.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const res = await userApi.getUsers({
          search: userSearchQuery.trim(),
          limit: 6,
        });
        setUserSearchResults(res.users);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery]);

  // Roles available for staff assignment (exclude pure customer role)
  const staffAssignableRoles = useMemo(() => {
    return roles.filter((r) => r.name !== 'CUSTOMER');
  }, [roles]);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      setIsUpdating(userId);
      await userApi.updateRole(userId, newRoleId);
      const roleObj = roles.find((r) => r.id === newRoleId);
      setStaffList((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, roleId: newRoleId, roleName: roleObj?.name } : s))
      );
      toast.success('Staff role updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update staff role');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      setIsUpdating(userId);
      await userApi.updateStatus(userId, newStatus);
      setStaffList((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, status: newStatus } : s))
      );
      if (selectedStaff && selectedStaff.id === userId) {
        setSelectedStaff({ ...selectedStaff, status: newStatus });
      }
      toast.success(`Staff account marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update staff status');
    } finally {
      setIsUpdating(null);
    }
  };

  // Promote existing user to staff role
  const handlePromoteExistingUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserToPromote) {
      toast.error('Please select an existing user by email first');
      return;
    }
    if (!promoteRoleId) {
      toast.error('Please choose a staff role to assign');
      return;
    }

    try {
      setIsPromoting(true);
      await userApi.updateRole(selectedUserToPromote.id, promoteRoleId);

      const assignedRole = roles.find((r) => r.id === promoteRoleId);
      toast.success(
        `Added "${selectedUserToPromote.fullName}" (${selectedUserToPromote.email}) as ${assignedRole?.name || 'Staff'}`
      );

      setIsAddOpen(false);
      setSelectedUserToPromote(null);
      setUserSearchQuery('');
      setPromoteRoleId('');
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

    if (!newStaff.fullName.trim() || !newStaff.email.trim() || !newStaff.password) {
      toast.error('Please enter name, email, and temporary password');
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
        password: newStaff.password,
        roleId: newStaff.roleId,
      });

      toast.success(`Staff member "${newStaff.fullName}" created successfully`);
      setIsAddOpen(false);
      setNewStaff({ fullName: '', email: '', password: '', roleId: '' });
      fetchStaffAndRoles();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create staff member');
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;

    if (currentUser && staffToDelete.id === currentUser.id) {
      toast.error('You cannot delete your own active administrator account.');
      setStaffToDelete(null);
      return;
    }

    try {
      setIsDeleting(true);
      await userApi.deleteUser(staffToDelete.id);
      toast.success(`Staff member "${staffToDelete.fullName}" removed`);
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
    () => staffList.filter((s) => (s.status || 'ACTIVE') === 'ACTIVE').length,
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Members</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Internal Team
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage your store management team, assign role permissions, and control internal administrative privileges
          </p>
        </div>

        <Button onClick={() => setIsAddOpen(true)} className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Staff Member
        </Button>
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
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue placeholder="Filter by role">
                {roleFilter === 'all'
                  ? 'All Staff Roles'
                  : staffAssignableRoles.find((r) => r.id === roleFilter)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff Roles</SelectItem>
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
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Status">
                {statusFilter === 'all' ? 'All Statuses' : statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[240px]">Staff Member</TableHead>
              <TableHead className="min-w-[180px]">Assigned Role</TableHead>
              <TableHead className="min-w-[200px]">Permissions Scope</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[140px]">Joined</TableHead>
              <TableHead className="text-right w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                        <div className="space-y-1.5 min-w-0">
                          <div className="h-4 w-32 bg-muted rounded-md" />
                          <div className="h-3 w-40 bg-muted rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="h-8 w-[160px] bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-28 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 rounded-full bg-muted" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-28 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <div className="h-8 w-8 rounded-md bg-muted" />
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
                const isCurrentAdmin = Boolean(currentUser?.id && staff.id === currentUser.id);

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
                            {isCurrentAdmin && (
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

                    {/* Assigned Role (Interactive Role Switcher) */}
                    <TableCell>
                      <div className="w-[160px]">
                        <Select
                          value={staff.roleId}
                          disabled={Boolean(isUpdating === staff.id || isCurrentAdmin)}
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
                    </TableCell>

                    {/* Permissions Scope */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {roleName === 'ADMIN' ? (
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 text-xs">
                            <Sparkles className="h-3 w-3 mr-1" /> Full Store Access
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
                      {status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 text-xs font-medium">
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

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Staff Info */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View staff details"
                          onClick={() => {
                            setSelectedStaff(staff);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Toggle Status */}
                        {!isCurrentAdmin ? (
                          status === 'ACTIVE' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isUpdating === staff.id}
                              className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                              title="Suspend staff member"
                              onClick={() => handleStatusChange(staff.id, 'SUSPENDED')}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isUpdating === staff.id}
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              title="Activate staff member"
                              onClick={() => handleStatusChange(staff.id, 'ACTIVE')}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )
                        ) : null}

                        {/* Delete Staff (protected if current admin) */}
                        {!isCurrentAdmin ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title="Remove staff member"
                            onClick={() => setStaffToDelete(staff)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div
                            className="h-8 w-8 flex items-center justify-center text-muted-foreground/30 cursor-not-allowed"
                            title="Active admin account cannot be deleted"
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
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
          itemsPerPageOptions={[5, 10, 20, 50]}
        />
      )}

      {/* ========================================================================= */}
      {/* Add Staff Member Modal Dialog (Search by Email or Create New) */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 border-b bg-card">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Add Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select an existing user by email to assign a staff role, or register a new team member
            </DialogDescription>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md text-xs font-medium mt-3">
              <button
                type="button"
                onClick={() => setAddMode('promote')}
                className={`flex-1 py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === 'promote'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserSearch className="h-3.5 w-3.5" />
                Select by Email
              </button>
              <button
                type="button"
                onClick={() => setAddMode('create')}
                className={`flex-1 py-1.5 px-3 rounded transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === 'create'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create New Staff
              </button>
            </div>
          </DialogHeader>

          {addMode === 'promote' ? (
            /* ========================================== */
            /* MODE 1: Search by Email & Assign Role     */
            /* ========================================== */
            <form onSubmit={handlePromoteExistingUser} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-email-search" className="text-sm font-semibold">
                  Search Registered User by Email <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-email-search"
                    placeholder="Type user email (e.g. hafeef@gmail.com, ziyam...)"
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                      if (selectedUserToPromote) setSelectedUserToPromote(null);
                    }}
                    className="pl-9 h-9 text-sm"
                  />
                  {isSearchingUsers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                </div>
              </div>

              {/* Search Results Dropdown List */}
              {userSearchResults.length > 0 && !selectedUserToPromote && (
                <div className="rounded-md border bg-popover shadow-md overflow-hidden max-h-[180px] overflow-y-auto">
                  <div className="p-1.5 text-[11px] font-semibold text-muted-foreground bg-muted/30 border-b">
                    Matching Users ({userSearchResults.length}) - Click to select
                  </div>
                  {userSearchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUserToPromote(u);
                        setUserSearchQuery(u.email);
                        setUserSearchResults([]);
                      }}
                      className="p-2.5 hover:bg-muted/60 cursor-pointer transition-colors flex items-center justify-between border-b last:border-0"
                    >
                      <div>
                        <div className="font-semibold text-xs text-foreground">{u.fullName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {u.email}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {u.roleName || 'Customer'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected User Display Card */}
              {selectedUserToPromote && (
                <div className="p-3.5 rounded-lg border bg-primary/5 border-primary/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Selected User
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUserToPromote(null);
                        setUserSearchQuery('');
                      }}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Change
                    </Button>
                  </div>
                  <div className="font-bold text-sm text-foreground">
                    {selectedUserToPromote.fullName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Email: <span className="text-foreground">{selectedUserToPromote.email}</span>
                  </div>
                </div>
              )}

              {/* Assign Role Field */}
              <div className="space-y-2 pt-1">
                <Label className="text-sm font-semibold">
                  Assign Staff Role / Rules <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={promoteRoleId}
                  onValueChange={(val) => setPromoteRoleId(val || '')}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Choose staff role (e.g. MANAGER, SUPPORT, EDITOR)...">
                      {staffAssignableRoles.find((r) => r.id === promoteRoleId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {staffAssignableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{r.name}</span>
                          <span className="text-muted-foreground text-[11px]">
                            ({r.permissions.length} perms)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  The user will immediately receive all access privileges mapped to this role.
                </p>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPromoting || !selectedUserToPromote || !promoteRoleId}
                  className="gap-2"
                >
                  {isPromoting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Assigning Staff...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Add User to Staff
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            /* ========================================== */
            /* MODE 2: Create Brand New Staff Account     */
            /* ========================================== */
            <form onSubmit={handleCreateNewStaff} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name" className="text-sm font-semibold">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="staff-name"
                  placeholder="e.g. Sarah Jenkins"
                  value={newStaff.fullName}
                  onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-email" className="text-sm font-semibold">
                  Official Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="staff-email"
                  type="email"
                  placeholder="e.g. sarah@yox.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password" className="text-sm font-semibold">
                  Temporary Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="staff-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Assigned Staff Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={newStaff.roleId}
                  onValueChange={(val) => setNewStaff({ ...newStaff, roleId: val || '' })}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Select access role...">
                      {staffAssignableRoles.find((r) => r.id === newStaff.roleId)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {staffAssignableRoles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{r.name}</span>
                          <span className="text-muted-foreground text-[11px]">
                            ({r.permissions.length} perms)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="gap-2">
                  {isCreating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating Staff...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Create Staff Member
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Staff Details & Permissions Inspector Modal */}
      {/* ========================================================================= */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[520px]">
          {selectedStaff && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
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

              <div className="space-y-4 py-2 text-sm">
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
                            <Sparkles className="h-3 w-3 mr-1" /> Unrestricted Super Admin
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

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* Delete Confirmation Dialog */}
      {/* ========================================================================= */}
      <Dialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Remove Staff Member
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to permanently remove staff member{' '}
              <strong className="text-foreground">{staffToDelete?.fullName}</strong> ({staffToDelete?.email})?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md border border-destructive/20">
            Warning: This team member will immediately lose access to the admin dashboard.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setStaffToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Confirm Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
