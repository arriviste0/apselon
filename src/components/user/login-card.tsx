'use client';

import * as React from 'react';
import { User } from '@/lib/types';
import { useUser } from '@/components/user/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ADMIN_PASSWORD = 'admin123';
const EMPLOYEE_PASSWORD = 'employee123';

export function LoginCard() {
  const { login } = useUser();
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
      } catch (err) {
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
    <Card className="w-full shadow-sm">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleLogin}>Log in</Button>
        </div>
      </CardContent>
    </Card>
  );
}
