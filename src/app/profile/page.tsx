'use client';
import { useUser } from '@/components/user/user-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoginCard } from '@/components/user/login-card';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, logout } = useUser();

  return (
    <div className="flex flex-col gap-6">
      {user ? (
        <Card className="w-full shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/apselon_logo.PNG"
                alt="Apselon"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <CardTitle>Profile</CardTitle>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/apselon_logo.PNG"
                  alt="Apselon"
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-contain"
                />
                <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Role: <span className="font-medium text-foreground">{user.role}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Department:{' '}
                  <span className="font-medium text-foreground">{user.department}</span>
                </div>
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
          </CardContent>
        </Card>
      ) : (
        <LoginCard />
      )}
    </div>
  );
}
