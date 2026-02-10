
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/challenges');
      } else {
        router.replace('/login');
      }
    }
  }, [router, user, isLoading]);

  return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 p-4">
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
