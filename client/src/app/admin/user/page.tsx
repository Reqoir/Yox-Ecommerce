'use client';

import { useState, useEffect, useCallback } from 'react';
import { userApi, User } from '@/api/admin/users';
import { roleApi, Role } from '@/api/admin/roles';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, MoreHorizontal, Eye, Trash, CheckCircle, Ban, AlertTriangle, UserCheck, UserX, Shield, Mail, Calendar, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', password: '', roleId: '' });
  const [isCreating, setIsCreating] = useState(false);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usersResponse, rolesData] = await Promise.all([
        userApi.getUsers({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery || undefined,
          roleId: roleFilter === 'all' ? undefined : roleFilter,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        roleApi.getAll()
      ]);
      setUsers(usersResponse.users);
      setTotalPages(usersResponse.meta?.totalPages || 1);
      setTotalItems(usersResponse.meta?.totalItems || usersResponse.users.length);
      setRoles(rolesData);
    } catch (error) {
      toast.error('Failed to load users and roles');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, roleFilter, statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      setIsUpdating(userId);
      await userApi.updateRole(userId, newRoleId);
      setUsers(users.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u));
      toast.success('User role updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update user role');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      setIsUpdating(userId);
      await userApi.updateStatus(userId, newStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      toast.success(`User status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${fullName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setIsUpdating(userId);
      await userApi.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete user');
      setIsUpdating(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.roleId) {
      toast.error('Please select a role for the user');
      return;
    }
    
    try {
      setIsCreating(true);
      const created = await userApi.createUser(newUser);
      setUsers([created, ...users]);
      setTotalItems(prev => prev + 1);
      setIsAddOpen(false);
      setNewUser({ fullName: '', email: '', password: '', roleId: '' });
      toast.success('User created successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenView = async (user: User) => {
    try {
      setSelectedUser(user);
      setIsViewOpen(true);
      const fullDetails = await userApi.getUserById(user.id);
      setSelectedUser(fullDetails);
    } catch (error) {
      console.error('Failed to fetch full user details:', error);
    }
  };

  const renderStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            Inactive
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
            <Ban className="h-3 w-3" />
            Suspended
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Staff</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer accounts, add staff members, and configure role-based access control.
          </p>
        </div>
        <Button className="gap-2 shrink-0 shadow-sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User / Staff
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-9 h-10 w-full"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Select 
              value={roleFilter} 
              onValueChange={(val) => {
                setRoleFilter(val || 'all');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs 
          value={statusFilter} 
          onValueChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
          className="w-full lg:w-auto"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-[360px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="INACTIVE">Inactive</TabsTrigger>
            <TabsTrigger value="SUSPENDED">Suspended</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="shadow-sm border">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            User Directory <span className="text-muted-foreground font-normal text-sm ml-2">({totalItems} total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead className="w-[80px] text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <span>Loading user directory...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Shield className="h-8 w-8 text-muted-foreground/50" />
                      <span className="font-medium">No users found</span>
                      <span className="text-xs text-muted-foreground">Try adjusting your search or filter criteria.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-sm shrink-0">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate">{user.fullName}</span>
                          <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{renderStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.roleId} 
                        onValueChange={(val) => val && handleRoleChange(user.id, val)}
                        disabled={isUpdating === user.id}
                      >
                        <SelectTrigger className="w-[150px] h-8 text-xs font-medium">
                          <SelectValue placeholder="Select a role">
                            {roles.find(r => r.id === user.roleId)?.name || user.roleName || 'Customer'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id} className="text-xs">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger className={buttonVariants({ variant: "ghost", className: "h-8 w-8 p-0" })}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs text-muted-foreground">User Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleOpenView(user)} onSelect={(e) => { e.preventDefault(); handleOpenView(user); }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status !== 'ACTIVE' && (
                              <DropdownMenuItem 
                                className="text-green-600 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-950/50"
                                onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                                onSelect={(e) => { e.preventDefault(); handleStatusChange(user.id, 'ACTIVE'); }}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate Account
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'INACTIVE' && (
                              <DropdownMenuItem 
                                className="text-yellow-600 focus:text-yellow-600 focus:bg-yellow-50 dark:focus:bg-yellow-950/50"
                                onClick={() => handleStatusChange(user.id, 'INACTIVE')}
                                onSelect={(e) => { e.preventDefault(); handleStatusChange(user.id, 'INACTIVE'); }}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'SUSPENDED' && (
                              <DropdownMenuItem 
                                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50 dark:focus:bg-orange-950/50"
                                onClick={() => handleStatusChange(user.id, 'SUSPENDED')}
                                onSelect={(e) => { e.preventDefault(); handleStatusChange(user.id, 'SUSPENDED'); }}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend Access
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => handleDeleteUser(user.id, user.fullName)}
                              onSelect={(e) => { e.preventDefault(); handleDeleteUser(user.id, user.fullName); }}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium">{users.length}</span> of <span className="font-medium">{totalItems}</span> users
          </p>
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              User Profile Details
            </DialogTitle>
            <DialogDescription>
              Complete account information and security status.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border">
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg shrink-0">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold">{selectedUser.fullName}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {selectedUser.email}
                  </p>
                </div>
                <div className="ml-auto">
                  {renderStatusBadge(selectedUser.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1">Assigned Role</span>
                  <span className="font-medium text-primary">
                    {roles.find(r => r.id === selectedUser.roleId)?.name || selectedUser.roleName || 'Customer'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Joined Date
                  </span>
                  <span className="font-medium">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border bg-card space-y-2">
                <span className="text-xs text-muted-foreground block font-medium flex items-center gap-1">
                  <Key className="h-3 w-3" /> Role Permissions
                </span>
                {selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedUser.permissions.map((perm, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {perm}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Standard customer access (no elevated admin permissions)</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User / Staff</DialogTitle>
            <DialogDescription>
              Create a new account and assign appropriate role permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="e.g. Sarah Connor"
                value={newUser.fullName} 
                onChange={e => setNewUser({...newUser, fullName: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="e.g. sarah@example.com"
                value={newUser.email} 
                onChange={e => setNewUser({...newUser, email: e.target.value})} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Temporary Password</Label>
              <Input 
                id="password" 
                type="text" 
                value={newUser.password} 
                onChange={e => setNewUser({...newUser, password: e.target.value})} 
                placeholder="Leave blank for auto-generated password"
              />
            </div>
            <div className="space-y-2">
              <Label>System Role</Label>
              <Select 
                value={newUser.roleId} 
                onValueChange={val => setNewUser({...newUser, roleId: val || ''})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

