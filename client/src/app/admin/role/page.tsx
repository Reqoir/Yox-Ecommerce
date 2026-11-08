'use client';

import { useState, useEffect, useMemo } from 'react';
import { roleApi, Role, CreateRoleDTO, UpdateRoleDTO, PERMISSIONS_LIST } from '@/api/admin/roles';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Sliders,
  Check,
  X,
  Info,
  Lock,
  Package,
  ShoppingCart,
  UserCog,
  BarChart3,
  Search,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';

interface PermissionItem {
  id: string;
  label: string;
  description: string;
}

interface PermissionCategory {
  title: string;
  description: string;
  icon: any;
  permissions: PermissionItem[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    title: 'Catalog & Inventory',
    description: 'Products, categories, brands, and stock replenishment',
    icon: Package,
    permissions: [
      { id: 'manage_products', label: 'Manage Products', description: 'Create, update, and manage product listings' },
      { id: 'manage_categories', label: 'Manage Categories', description: 'Organize category tree and classifications' },
      { id: 'manage_brands', label: 'Manage Brands', description: 'Configure manufacturer and brand entries' },
      { id: 'manage_inventory', label: 'Manage Inventory', description: 'Track variant stock, counts, and replenishment' },
    ],
  },
  {
    title: 'Sales & Customers',
    description: 'Orders, reviews, coupons, and customer profiles',
    icon: ShoppingCart,
    permissions: [
      { id: 'manage_orders', label: 'Manage Orders', description: 'Process shipments, cancellations, and order updates' },
      { id: 'manage_users', label: 'Manage Customers', description: 'Browse and manage customer buyer accounts' },
      { id: 'manage_reviews', label: 'Manage Reviews', description: 'Moderate customer ratings and review submissions' },
      { id: 'manage_offers', label: 'Manage Offers', description: 'Create promotional discounts, coupons, and deals' },
    ],
  },
  {
    title: 'Team & Access Control',
    description: 'Staff directory, management actions, and security roles',
    icon: UserCog,
    permissions: [
      { id: 'view_staff', label: 'View Staff Directory', description: 'Browse team members & contact info (Read-Only)' },
      { id: 'manage_staff', label: 'Manage Staff Members', description: 'Add, edit, reset passwords, suspend or delete staff' },
      { id: 'manage_roles', label: 'Manage Roles & Permissions', description: 'Create and configure staff roles and ranks' },
    ],
  },
  {
    title: 'Analytics & Administration',
    description: 'Reporting, system settings, banners, and notifications',
    icon: BarChart3,
    permissions: [
      { id: 'dashboard:read', label: 'Dashboard Overview', description: 'Access dashboard summary cards and quick stats' },
      { id: 'view_analytics', label: 'Store Analytics', description: 'Deep-dive sales graphs, conversion, and performance' },
      { id: 'view_reports', label: 'Financial Reports', description: 'Export payment settlements and financial statements' },
      { id: 'view_audit_logs', label: 'Audit Logs', description: 'Inspect administrative audit trails and security events' },
      { id: 'manage_settings', label: 'Store Settings', description: 'Configure store configuration and preferences' },
      { id: 'manage_notifications', label: 'Notifications', description: 'Broadcast team announcements and alerts' },
      { id: 'manage_content', label: 'Content & CMS', description: 'Manage promotional banners and storefront CMS' },
    ],
  },
];

export default function RoleManagementPage() {
  const { user: currentUser } = useAdminAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Actor Hierarchy & Permission Context
  const isStoreOwner = useMemo(() => {
    if (!currentUser) return false;
    return (currentUser.email || '').toLowerCase() === 'admin@yox.com';
  }, [currentUser]);

  const currentActorLevel = useMemo(() => {
    if (!currentUser) return 0;
    if (isStoreOwner) return 100;
    const roleObj = roles.find(
      (r) => r.id === currentUser.roleId || r.name.toUpperCase() === (currentUser.role || '').toUpperCase()
    );
    if (roleObj) {
      const roleName = roleObj.name.toUpperCase();
      if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN' || roleObj.permissions?.includes('*')) {
        return 100;
      }
      return roleObj.level ?? (roleName === 'MANAGER' ? 75 : 50);
    }
    const roleUpper = (currentUser.role || '').toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') return 100;
    return 50;
  }, [currentUser, roles, isStoreOwner]);

  const maxLevelAllowed = useMemo(() => {
    if (isStoreOwner) return 100;
    return Math.max(0, currentActorLevel - 1);
  }, [isStoreOwner, currentActorLevel]);

  // Evaluates editing/deletion eligibility for a given role against current actor
  const checkRolePermissions = (role: Role) => {
    if (isStoreOwner) return { canEdit: true, canDelete: !role.isSystem, reason: '' };

    const roleName = (role.name || '').toUpperCase();
    let rLevel = role.level;
    if (rLevel === undefined || rLevel === 20) {
      if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN') rLevel = 100;
      else if (roleName === 'CUSTOMER') rLevel = 0;
      else if (roleName === 'MANAGER') rLevel = 75;
      else if (roleName === 'EDITOR' || roleName === 'SUPPORT') rLevel = 50;
    }
    if (rLevel === undefined) rLevel = 50;

    // 1. Admin role is permanently protected from non-Store-Owners
    if (roleName === 'ADMIN' || rLevel >= 100) {
      return {
        canEdit: false,
        canDelete: false,
        reason: 'Only the primary Store Owner can modify or delete the Administrator role.',
      };
    }

    // 2. Self-Privilege Escalation Prevention: User cannot edit their own assigned role!
    const isOwnRole = Boolean(
      (currentUser?.roleId && role.id === currentUser.roleId) ||
      (currentUser?.role && roleName === currentUser.role.toUpperCase())
    );
    if (isOwnRole) {
      return {
        canEdit: false,
        canDelete: false,
        reason: 'Self-Privilege Escalation Prevention: You cannot modify your own assigned role or its permissions.',
      };
    }

    // 3. Hierarchy restriction: User cannot edit a role with equal or higher rank
    if (currentActorLevel <= rLevel) {
      return {
        canEdit: false,
        canDelete: false,
        reason: `Hierarchy Restriction: Your rank (Level ${currentActorLevel}) cannot modify a role with equal or higher rank (Level ${rLevel}).`,
      };
    }

    return {
      canEdit: true,
      canDelete: !role.isSystem,
      reason: '',
    };
  };

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<number>(50);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [searchPermissionQuery, setSearchPermissionQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(roles.length / itemsPerPage);
  const paginatedRoles = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const data = await roleApi.getAll();
      setRoles(data);
    } catch (error) {
      toast.error('Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setLevel(Math.min(50, maxLevelAllowed));
    setSelectedPermissions([]);
    setSearchPermissionQuery('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: Role) => {
    const { canEdit, reason } = checkRolePermissions(role);
    if (!canEdit) {
      toast.error(reason);
      return;
    }
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    let resolvedLevel = role.level;
    const rName = (role.name || '').toUpperCase();
    if (resolvedLevel === undefined || resolvedLevel === 20) {
      if (rName === 'ADMIN' || rName === 'SUPER_ADMIN') resolvedLevel = 100;
      else if (rName === 'CUSTOMER') resolvedLevel = 0;
      else if (rName === 'MANAGER') resolvedLevel = 75;
      else if (rName === 'EDITOR' || rName === 'SUPPORT') resolvedLevel = 50;
    }
    setLevel(resolvedLevel !== undefined ? resolvedLevel : 50);
    setSelectedPermissions(role.permissions);
    setSearchPermissionQuery('');
    setIsDialogOpen(true);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategoryPermissions = (categoryPerms: string[]) => {
    const allSelected = categoryPerms.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...categoryPerms])));
    }
  };

  const toggleSelectAllPermissions = () => {
    if (selectedPermissions.length === PERMISSIONS_LIST.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(PERMISSIONS_LIST.map((p) => p.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Role name is required');
      return;
    }

    if (!isStoreOwner && Number(level) >= currentActorLevel) {
      toast.error(`You cannot set a hierarchy rank (Level ${level}) equal to or higher than your own (Level ${currentActorLevel}).`);
      return;
    }

    if (editingRole) {
      const { canEdit, reason } = checkRolePermissions(editingRole);
      if (!canEdit) {
        toast.error(reason);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name,
        description,
        permissions: selectedPermissions,
        level: Number(level),
      };

      if (editingRole) {
        await roleApi.update(editingRole.id, payload);
        toast.success('Role updated successfully');
      } else {
        await roleApi.create(payload as CreateRoleDTO);
        toast.success('Role created successfully');
      }

      setIsDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (role: Role) => {
    const { canDelete, reason } = checkRolePermissions(role);
    if (!canDelete) {
      toast.error(reason || 'You do not have permission to delete this role.');
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    try {
      await roleApi.delete(role.id);
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage system roles and their access levels
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Hierarchy Rank</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell>
                      <div className="h-4 w-32 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="h-4 w-48 bg-muted rounded-md" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-24 bg-muted rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-muted rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="h-5 w-20 bg-muted rounded-full" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <div className="h-8 w-8 bg-muted rounded-md" />
                        <div className="h-8 w-8 bg-muted rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No roles found
                </TableCell>
              </TableRow>
            ) : (
              paginatedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {role.description || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.length > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                          {role.permissions.length} permissions
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const roleName = (role.name || '').toUpperCase();
                      let rLevel = role.level;
                      if (rLevel === undefined || rLevel === 20) {
                        if (roleName === 'ADMIN' || roleName === 'SUPER_ADMIN') rLevel = 100;
                        else if (roleName === 'CUSTOMER') rLevel = 0;
                        else if (roleName === 'MANAGER') rLevel = 75;
                        else if (roleName === 'EDITOR' || roleName === 'SUPPORT') rLevel = 50;
                      }
                      if (rLevel === undefined) rLevel = 50;
                      return (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border",
                            rLevel === 100
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                              : rLevel >= 75
                              ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                              : rLevel >= 50
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : rLevel > 0
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          Level {rLevel}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium">
                        <ShieldAlert className="h-3 w-3" />
                        System
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                        Custom
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const { canEdit, canDelete, reason } = checkRolePermissions(role);
                      return (
                        <div className="flex justify-end items-center gap-1.5">
                          {canEdit ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(role)}
                              title="Edit role & permissions"
                              className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : (
                            <div
                              className="h-8 w-8 flex items-center justify-center text-muted-foreground/40 cursor-not-allowed"
                              title={reason}
                            >
                              <Lock className="h-3.5 w-3.5" />
                            </div>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDelete(role)}
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={roles.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[720px] md:max-w-[780px] max-h-[88vh] flex flex-col p-0 overflow-hidden rounded-2xl border bg-card shadow-2xl gap-0">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Fixed Header */}
            <DialogHeader className="p-5 sm:p-6 pb-4 border-b bg-card shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {editingRole ? <ShieldCheck className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-foreground truncate">
                      {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                      {editingRole
                        ? 'Configure hierarchy level rank and functional permission privileges'
                        : 'Define role identity, hierarchy rank level, and assign access permissions'}
                    </DialogDescription>
                  </div>
                </div>
                {editingRole?.isSystem && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shrink-0 font-semibold gap-1">
                    <Lock className="h-3 w-3" /> System Role
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {/* Scrollable Middle Container */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold text-foreground">
                    Role Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. MARKETING_MANAGER"
                    disabled={editingRole?.isSystem}
                    className="h-9.5 text-xs font-medium"
                  />
                  {editingRole?.isSystem ? (
                    <p className="text-[10.5px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Lock className="h-3 w-3 shrink-0" /> System role names are protected and cannot be changed.
                    </p>
                  ) : (
                    <p className="text-[10.5px] text-muted-foreground">
                      Use UPPERCASE identifiers (e.g. DATA_ENTRY, ORDER_MANAGER).
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-semibold text-foreground">
                    Role Description
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Enters and updates product catalog entries"
                    disabled={editingRole?.isSystem}
                    className="h-9.5 text-xs"
                  />
                  <p className="text-[10.5px] text-muted-foreground">
                    Brief summary of duties and operational scope.
                  </p>
                </div>
              </div>

              {/* Hierarchy Rank Level (Style 1) */}
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Sliders className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor="level" className="font-bold text-xs text-foreground block">
                        Hierarchy Level Rank (0 – 100)
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Governs supervisory authority over other staff members
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit font-bold text-xs py-0.5 px-2.5 shrink-0",
                      level === 100
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30"
                        : level >= 75
                        ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
                        : level >= 50
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : level > 0
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {level === 100
                      ? `Full Administrator · Level 100`
                      : level >= 75
                      ? `Store Manager · Level ${level}`
                      : level >= 50
                      ? `Support / Editor · Level ${level}`
                      : level > 0
                      ? `Staff Member · Level ${level}`
                      : `Standard Customer · Level 0`}
                  </Badge>
                </div>

                {/* Slider and Input */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={maxLevelAllowed}
                    value={Math.min(level, maxLevelAllowed)}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="flex-1 accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="w-16 shrink-0">
                    <Input
                      id="level"
                      type="number"
                      min={0}
                      max={maxLevelAllowed}
                      value={level}
                      onChange={(e) => setLevel(Math.min(maxLevelAllowed, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="h-8.5 text-xs font-bold text-center bg-background"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground mr-1">Presets:</span>
                  {[
                    { label: 'Customer (0)', val: 0 },
                    { label: 'Support (50)', val: 50 },
                    { label: 'Editor (50)', val: 50 },
                    { label: 'Manager (75)', val: 75 },
                    { label: 'Admin (100)', val: 100 },
                  ].map((preset) => {
                    const isPresetDisabled = preset.val > maxLevelAllowed;
                    return (
                      <button
                        key={`${preset.label}-${preset.val}`}
                        type="button"
                        disabled={isPresetDisabled}
                        onClick={() => setLevel(preset.val)}
                        title={isPresetDisabled ? `Cannot set rank equal to or above your rank (Level ${currentActorLevel})` : undefined}
                        className={cn(
                          "text-[10.5px] px-2.5 py-1 rounded-lg border font-medium transition-all",
                          isPresetDisabled
                            ? "opacity-35 cursor-not-allowed bg-muted text-muted-foreground border-border/50"
                            : "cursor-pointer",
                          level === preset.val && !isPresetDisabled
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background hover:bg-muted text-foreground border-border"
                        )}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Hierarchy Rule Info Box */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-background/80 border text-[11px] text-muted-foreground leading-relaxed">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>
                    {!isStoreOwner ? (
                      <>
                        As a staff manager (Rank Level {currentActorLevel}), you can only configure roles with rank strictly lower than your own (Maximum Rank Level {maxLevelAllowed}). Store Owner rank is Level 100.
                      </>
                    ) : (
                      <>
                        Staff managers with this role can only supervise, reset passwords, suspend, or delete team members whose rank is strictly <strong>lower than Level {level}</strong>. (Store Owner is permanently Level 100).
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <Label className="text-sm font-bold text-foreground block">
                      Permissions Scope
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select individual privileges to grant to users assigned this role
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold py-1 px-2.5 bg-primary/5 text-primary border-primary/20">
                      {selectedPermissions.length} of {PERMISSIONS_LIST.length} Granted
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleSelectAllPermissions}
                      className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {selectedPermissions.length === PERMISSIONS_LIST.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>

                {/* Permission Search Bar */}
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions by name or keyword..."
                    value={searchPermissionQuery}
                    onChange={(e) => setSearchPermissionQuery(e.target.value)}
                    className="h-8.5 pl-8.5 text-xs bg-muted/30"
                  />
                  {searchPermissionQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchPermissionQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Categorized Permissions Grid */}
                <div className="space-y-4">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const filteredPerms = category.permissions.filter((p) => {
                      if (!searchPermissionQuery.trim()) return true;
                      const q = searchPermissionQuery.toLowerCase();
                      return (
                        p.label.toLowerCase().includes(q) ||
                        p.id.toLowerCase().includes(q) ||
                        p.description.toLowerCase().includes(q)
                      );
                    });

                    if (filteredPerms.length === 0) return null;

                    const catPermIds = category.permissions.map((p) => p.id);
                    const selectedInCat = category.permissions.filter((p) => selectedPermissions.includes(p.id)).length;
                    const allCatSelected = catPermIds.length > 0 && catPermIds.every((id) => selectedPermissions.includes(id));
                    const CategoryIcon = category.icon;

                    return (
                      <div key={category.title} className="rounded-xl border bg-card p-3.5 space-y-2.5 shadow-xs">
                        {/* Category Header */}
                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                              <CategoryIcon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-foreground block">
                                {category.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground hidden sm:block">
                                {category.description}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {selectedInCat}/{category.permissions.length}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCategoryPermissions(catPermIds)}
                              className="h-6 text-[11px] px-2 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              {allCatSelected ? 'Clear' : 'Select All'}
                            </Button>
                          </div>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {filteredPerms.map((perm) => {
                            const isSelected = selectedPermissions.includes(perm.id);
                            return (
                              <div
                                key={perm.id}
                                onClick={() => handlePermissionToggle(perm.id)}
                                className={cn(
                                  "group relative flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all select-none cursor-pointer",
                                  isSelected
                                    ? "bg-primary/5 border-primary/40 shadow-xs"
                                    : "bg-muted/15 border-border/70 hover:border-border hover:bg-muted/40"
                                )}
                              >
                                <div className="pt-0.5 shrink-0">
                                  <Checkbox
                                    id={perm.id}
                                    checked={isSelected}
                                    onCheckedChange={() => handlePermissionToggle(perm.id)}
                                    className="data-[state=checked]:bg-primary pointer-events-none"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <label
                                    htmlFor={perm.id}
                                    className={cn(
                                      "text-xs font-semibold block leading-tight cursor-pointer",
                                      isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                                    )}
                                  >
                                    {perm.label}
                                  </label>
                                  <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <DialogFooter className="p-4 px-6 border-t bg-muted/20 shrink-0 flex flex-row items-center justify-between sm:justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedPermissions.length}</span> permissions active
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[100px] gap-2 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Save Role
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
