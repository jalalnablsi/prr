
'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex">
          <Link href="/challenges" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline">
              مختبر الدوبامين
            </span>
          </Link>
        </div>
        
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{user.name}</span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        )}

      </div>
    </header>
  );
}
