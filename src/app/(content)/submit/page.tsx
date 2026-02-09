"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function SubmitPage() {
  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
            <CardHeader>
                <Lock className="h-16 w-16 text-primary mx-auto mb-4" />
                <CardTitle className="text-3xl font-headline font-bold mb-2">وصول مقيد</CardTitle>
                <CardDescription className="text-lg">
                    هذه الميزة متاحة للمسؤولين فقط.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    يتم إضافة المحتوى والتحديات الجديدة من قبل فريق الإدارة لضمان أفضل تجربة للجميع.
                </p>
            </CardContent>
        </Card>
    </div>
  );
}
