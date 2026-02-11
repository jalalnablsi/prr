"use client";

import { Smartphone } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <Smartphone className="h-16 w-16 text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">التطبيق يعمل داخل تيليجرام</h1>
      <p className="text-muted-foreground max-w-sm">
        يرجى فتح هذا التطبيق المصغر (Mini App) من خلال بوت تيليجرام الخاص بنا للوصول إلى المحتوى.
      </p>
    </div>
  );
}
