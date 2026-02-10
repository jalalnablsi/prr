'use server';

import { createClient } from '@/lib/supabaseServer';

export async function getRandomChallenges() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('type', 'challenge')
    .neq('category', 'islamic')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  // === التعديل الهام هنا ===
  // نقوم بتحويل أسماء الحقول من Snake Case إلى Camel Case لتطابق TypeScript Types
  const transformedData = data.map((item: any) => ({
    ...item,
    // تحويل correct_option_id إلى correctOptionId
    correctOptionId: item.correct_option_id,
    // تحديث created_at إذا احتجته لاحقاً (اختياري)
    // createdAt: item.created_at 
  }));

  const shuffled = [...transformedData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 10);
}

export async function getUserGlobalStats(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .rpc('calculate_user_beat_percentage', { p_user_id: userId });

  if (error) {
    console.error('Stats Error:', error);
    return { beatPercentage: 0, totalPoints: 0 };
  }

  return data || { beatPercentage: 0, totalPoints: 0 };
}
export async function completeDailyChallenge(userId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from('users')
    .update({ last_daily_challenge_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error completing daily challenge:', error);
    return { success: false };
  }

  return { success: true };
}