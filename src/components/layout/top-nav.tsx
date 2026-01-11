'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookMarked, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/components/user/user-provider';

const navItems = [
  { href: '/', label: 'All Jobs', icon: LayoutDashboard },
  { href: '/master', label: 'Master', icon: BookMarked },
  { href: '/profile', label: 'Profile', icon: User },
];

export function TopNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const isEmployee = user?.role === 'employee';
  const visibleNavItems = isEmployee
    ? navItems.filter((item) => item.href !== '/')
    : navItems;

  return (
    <div className="border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <nav className="flex items-center gap-2 overflow-x-auto py-2">
        {visibleNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
