'use client';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  BookMarked,
  User,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/components/user/user-provider';

export function MainSidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isEmployee = user?.role === 'employee';

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Image src="/apselon_logo.PNG" alt="Apselon" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-xl font-semibold">Apselon</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            {!isEmployee && (
              <Link href="/" passHref>
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  tooltip="All Jobs"
                >
                  <LayoutDashboard />
                  All Jobs
                </SidebarMenuButton>
              </Link>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/master" passHref>
              <SidebarMenuButton
                isActive={pathname === '/master'}
                tooltip="Master"
              >
                <BookMarked />
                Master
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/profile" passHref>
              <SidebarMenuButton
                isActive={pathname === '/profile'}
                tooltip="Profile"
              >
                <User />
                Profile
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings" asChild>
              <Link href="/settings">
                <Settings />
                Settings
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Log Out">
              <LogOut />
              Log Out
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
