'use client';

import * as React from 'react';
import { useUser } from '@/components/user/user-provider';
import { LoginCard } from '@/components/user/login-card';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex min-h-[60svh] items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60svh] items-start justify-center px-4 py-6 sm:py-10">
        <div className="w-full max-w-lg">
          <LoginCard />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
