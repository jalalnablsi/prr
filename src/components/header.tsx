'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { Coins } from 'lucide-react';

export function Header() {
  const { user } = useAuth();

  const displayName = user?.first_name || user?.username || 'مستخدم';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center">
          <Link href="/challenges" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline hidden sm:inline-block">
              مختبر الدوبامين
            </span>
          </Link>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-primary font-bold">
              <Coins className="h-5 w-5" />
              <span className="text-sm">{user.points?.toLocaleString() || 0}</span>
            </div>

            <div className="flex items-center gap-3">
                <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">مرحباً بعودتك</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-primary/50">
                    <AvatarImage src={user.photo_url} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded-full" />
          </div>
        )}

      </div>
    </header>
  );
}
