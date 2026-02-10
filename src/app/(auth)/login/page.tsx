"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context'; // استيراد useAuth

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth(); // استخدام دالة التحديث

  const handleLogin = async () => {
    // بما أن الـ Context يقوم بتسجيل الدخول تلقائياً (Mock Mode)،
    // يمكننا هنا مجرد إعادة تحميل البيانات أو التوجيه مباشرة.
    
    await refreshUser(); // تأكيد تحديث البيانات
    router.replace('/challenges'); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">تسجيل الدخول</h1>
      <p className="text-muted-foreground mb-6 text-center">
        اضغط على الزر أدناه للدخول كـ "مطور تطبيق" (وضع التجربة).
      </p>
      <Button onClick={handleLogin} size="lg">
        دخول (Dev Mode)
      </Button>
    </div>
  );
}