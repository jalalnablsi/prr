
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Header } from "@/components/header";
import { BottomNavBar } from "@/components/bottom-nav-bar";
import { Skeleton } from '@/components/ui/skeleton';

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center justify-center space-y-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2 text-center">
                    <Skeleton className="h-4 w-[250px] mx-auto" />
                    <Skeleton className="h-4 w-[200px] mx-auto" />
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
