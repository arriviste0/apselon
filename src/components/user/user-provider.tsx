'use client';

import * as React from 'react';
import { User } from '@/lib/types';

interface UserContextValue {
  user: User | null;
  isLoading: boolean;
  login: (userId: string) => void;
  logout: () => void;
}

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'apselon-user-id';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [users, setUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to load users');
        }
        const fetchedUsers: User[] = await response.json();
        setUsers(fetchedUsers);
        const storedId = window.localStorage.getItem(USER_STORAGE_KEY);
        if (storedId) {
          const storedUser = fetchedUsers.find((u) => u.id === storedId) || null;
          setUser(storedUser);
        }
      } catch (error) {
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const login = React.useCallback(
    (userId: string) => {
      const nextUser = users.find((u) => u.id === userId) || null;
      setUser(nextUser);
      if (nextUser) {
        window.localStorage.setItem(USER_STORAGE_KEY, nextUser.id);
      } else {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    },
    [users]
  );

  const logout = React.useCallback(() => {
    setUser(null);
    window.localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
