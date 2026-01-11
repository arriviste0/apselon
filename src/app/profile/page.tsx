'use client';

import * as React from 'react';
import { User } from '@/lib/types';
import { useUser } from '@/components/user/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADMIN_PASSWORD = 'admin123';
const EMPLOYEE_PASSWORD = 'employee123';

export default function ProfilePage() {
  const { user, login, logout } = useUser();
  const [users, setUsers] = React.useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState<string>('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to load users');
        }
        const fetchedUsers: User[] = await response.json();
        setUsers(fetchedUsers);
      } catch (error) {
        setUsers([]);
      }
    };
    loadUsers();
  }, []);

  const handleLogin = () => {
    setError(null);
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) {
      setError('Select a user.');
      return;
    }
    const expectedPassword =
      selectedUser.role === 'admin' ? ADMIN_PASSWORD : EMPLOYEE_PASSWORD;
    if (password !== expectedPassword) {
      setError('Invalid password.');
      return;
    }
    login(selectedUser.id);
    setPassword('');
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Profile</CardTitle>
          {user && (
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {user ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Role: <span className="font-medium text-foreground">{user.role}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Department:{' '}
                  <span className="font-medium text-foreground">{user.department}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={logout}>
                  Log out
                </Button>
                {user.role === 'admin' && (
                  <Button asChild>
                    <Link href="/profile/report">Report & Summary</Link>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Select user</p>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Password</p>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Admin password: {ADMIN_PASSWORD} • Employee password: {EMPLOYEE_PASSWORD}
                </p>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={handleLogin}>Log in</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
