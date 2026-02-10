'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';

export function Header() {
  const { user } = useAuth();

  // تحديد اسم العرض: نستخدم الاسم الأول، وإذا لم يوجد نستخدم اسم المستخدم
  const displayName = user?.first_name || user?.username || 'مستخدم';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        {/* القسم الأيسر: الشعار */}
        <div className="flex items-center">
          <Link href="/challenges" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline hidden sm:inline-block">
              مختبر الدوبامين
            </span>
          </Link>
        </div>
        
        {/* القسم الأيمن: معلومات المستخدم */}
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium hidden md:inline-block text-foreground">
              {displayName}
            </span>
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={user.photo_url} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          // حالة التحميل (اختياري)
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          </div>
        )}

      </div>
    </header>
  );
}