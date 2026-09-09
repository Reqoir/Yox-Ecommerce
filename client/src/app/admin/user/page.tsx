'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { userApi, User } from '@/api/admin/users';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  Ban,
  AlertTriangle,
  UserCheck,
  UserX,
  Users,
  Mail,
  Calendar,
  Phone,
  Clock,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Customer Profile View Dialog
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  // Delete Customer Dialog
  const [customerToDelete, setCustomerToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        userType: 'customer',
      });
      setCustomers(response.users);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.totalItems || response.users.length);
    } catch (error) {
      toast.error('Failed to load customer accounts');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleStatusChange = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    try {
      setIsUpdating(userId);
      await userApi.updateStatus(userId, newStatus);
      setCustomers((prev) =>
        prev.map((c) => (c.id === userId ? { ...c, status: newStatus } : c))
      );
      if (selectedCustomer && selectedCustomer.id === userId) {
        setSelectedCustomer({ ...selectedCustomer, status: newStatus });
      }
      toast.success(`Customer account marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update customer status');
    } finally {
      setIsUpdating(null);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;

    try {
      setIsDeleting(true);
      await userApi.deleteUser(customerToDelete.id);
      toast.success(`Customer "${customerToDelete.fullName}" deleted`);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete customer account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const activeCount = useMemo(
    () => customers.filter((c) => (c.status || 'ACTIVE') === 'ACTIVE').length,
    [customers]
  );
  const suspendedCount = useMemo(
    () => customers.filter((c) => c.status === 'SUSPENDED').length,
    [customers]
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Customers</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
              Storefront Accounts
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            View registered customer profiles, monitor account status, and manage storefront access
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered buyers in the store</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In good standing and able to place orders</p>
          </CardContent>
        </Card>

        <Card className="border bg-card/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspended</CardTitle>
            <UserX className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {suspendedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Restricted or flagged customer accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-lg border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers by name, email, or phone..."
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

        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || 'all');
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-[260px]">Customer</TableHead>
              <TableHead className="min-w-[200px]">Contact Info</TableHead>
              <TableHead className="w-[140px]">Account Status</TableHead>
              <TableHead className="w-[160px]">Joined Date</TableHead>
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
                          <div className="h-3 w-16 bg-muted rounded-md" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-40 bg-muted rounded-md" />
                        <div className="h-3 w-24 bg-muted rounded-md" />
                      </div>
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
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/50" />
                    <span className="font-medium text-base">No customers found</span>
                    <span className="text-xs">
                      {searchQuery
                        ? `No customers match "${searchQuery}".`
                        : 'No storefront customer accounts registered yet.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => {
                const status = customer.status || 'ACTIVE';
                const initials = customer.fullName
                  ? customer.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)
                  : 'CU';

                return (
                  <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                    {/* Customer Identity */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">
                            {customer.fullName}
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            ID: {customer.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Contact Info */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 text-xs font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : status === 'SUSPENDED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900 px-2.5 py-0.5 text-xs font-medium">
                          <Ban className="h-3 w-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-300 px-2.5 py-0.5 text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </TableCell>

                    {/* Joined Date */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {customer.createdAt
                            ? new Date(customer.createdAt).toLocaleDateString('en-US', {
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
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="View customer profile"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setIsViewOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Toggle Status: Suspend or Activate */}
                        {status === 'ACTIVE' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating === customer.id}
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                            title="Suspend customer account"
                            onClick={() => handleStatusChange(customer.id, 'SUSPENDED')}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdating === customer.id}
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            title="Activate customer account"
                            onClick={() => handleStatusChange(customer.id, 'ACTIVE')}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete Customer */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          title="Delete customer account"
                          onClick={() => setCustomerToDelete(customer)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      {/* Customer Profile Inspection Dialog */}
      {/* ========================================================================= */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {selectedCustomer.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">
                      {selectedCustomer.fullName}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Customer ID: {selectedCustomer.id}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2 text-sm">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/30 border">
                  <div>
                    <span className="text-xs text-muted-foreground block">Email Address</span>
                    <span className="font-medium break-all">{selectedCustomer.email}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Phone Number</span>
                    <span className="font-medium">{selectedCustomer.phone || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Account Status</span>
                    <span className="font-medium">
                      {selectedCustomer.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Member Since</span>
                    <span className="font-medium">
                      {selectedCustomer.createdAt
                        ? new Date(selectedCustomer.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <span className="font-medium text-xs block">Account Security</span>
                    <span className="text-[11px] text-muted-foreground">
                      Toggle customer buying permissions on the storefront
                    </span>
                  </div>
                  {(selectedCustomer.status || 'ACTIVE') === 'ACTIVE' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => handleStatusChange(selectedCustomer.id, 'SUSPENDED')}
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Suspend Account
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      onClick={() => handleStatusChange(selectedCustomer.id, 'ACTIVE')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Activate Account
                    </Button>
                  )}
                </div>
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
      <Dialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Customer Account
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to permanently delete customer{' '}
              <strong className="text-foreground">{customerToDelete?.fullName}</strong> ({customerToDelete?.email})?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-md border border-destructive/20">
            Warning: This action will permanently remove this customer&apos;s credentials and account history.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCustomerToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
