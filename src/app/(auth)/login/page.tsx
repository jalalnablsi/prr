
'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    // Mock user as requested by the user.
    const mockTelegramUser = {
      id: 'user-moka-data',
      name: 'موكا داتا',
      avatarUrl: 'https://picsum.photos/seed/telegram/80/80',
      isTelegramUser: true,
    };
    login(mockTelegramUser);
    router.replace('/challenges'); // Redirect to challenges page as requested.
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
      <Card className="max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
              <Icons.logo className="h-16 w-16" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold mb-2">مختبر الدوبامين</CardTitle>
          <CardDescription className="text-lg">
              يجب عليك تسجيل الدخول عبر تيليجرام للمتابعة.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={handleLogin} className="w-full">
            تسجيل الدخول باستخدام تيليجرام
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
