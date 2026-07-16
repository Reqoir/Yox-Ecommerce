'use client';

import { useState, useEffect } from 'react';
import { userApi, User } from '@/api/admin/users';
import { roleApi, Role } from '@/api/admin/roles';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // Track which user is being updated

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersData, rolesData] = await Promise.all([
        userApi.getUsers(),
        roleApi.getAll()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      console.log('usersData', usersData);
      console.log('rolesData', rolesData);
    } catch (error) {
      toast.error('Failed to load users and roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRoleId: string) => {
    try {
      setIsUpdating(userId);
      await userApi.updateRole(userId, newRoleId);
      setUsers(users.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Manage users and assign roles.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead className="w-[200px]">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.createdAt ? user.createdAt.split('T')[0] : 'N/A'}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.roleId} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                        disabled={isUpdating === user.id}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role">
                            {roles.find(r => r.id === user.roleId)?.name || 'Select a role'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
