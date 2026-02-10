'use server';

import { createClient } from '@/lib/supabaseServer';

export async function addPointsToUser(userId: string, amount: number, reason: string, metadata: Record<string, any> = {}) {
  const supabase = createClient();

  // الخطوة الوحيدة المطلوبة: إدراج المعاملة
  // التريجر (Trigger) سيقوم تلقائياً بتحديث جدول users وزيادة النقاط
  const { error } = await supabase.from('point_transactions').insert({
    user_id: userId,
    amount: amount,
    reason: reason,
    metadata: metadata
  });

  if (error) {
    console.error('Error logging transaction:', error);
    return { success: false, message: 'فشل تسجيل العملية' };
  }

  return { success: true };
}