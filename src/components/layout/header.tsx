'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { useUser } from '@/components/user/user-provider';
import Link from 'next/link';

interface HeaderProps {
  currentUser?: User;
}

export function Header({ currentUser }: HeaderProps) {
  const { user: activeUser, logout } = useUser();
  const displayUser = activeUser ?? currentUser;
  const userAvatar =
    PlaceHolderImages.find((img) => img.id === 'user-avatar-1')?.imageUrl ||
    'https://avatar.vercel.sh/fallback.png';

  const userInitials = displayUser?.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/apselon_logo.PNG" alt="Apselon" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-lg font-semibold tracking-tight">Apselon</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-foreground">{displayUser?.name ?? 'User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{displayUser?.role ?? 'employee'}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userAvatar} alt={displayUser?.name || 'User'} data-ai-hint="person portrait" />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {displayUser?.name}
                <p className="text-xs text-muted-foreground font-normal">
                  {displayUser?.role}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
