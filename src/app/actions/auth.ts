'use server';

import { createClient } from '@/lib/supabaseServer';

export async function authenticateUser(user: any, isDevMode: boolean = false) {
  
  // حماية إضافية: التأكد من وجود البيانات
  if (!user || !user.id) {
    console.error("Error: User data is missing ID", user);
    throw new Error("بيانات المستخدم غير صالحة");
  }

  const supabase = createClient();

  const { data: dbUser, error } = await supabase
    .from('users')
    .upsert({
      telegram_id: user.id,
      username: user.username || null,
      first_name: user.first_name || 'Developer',
      last_name: user.last_name || null,
      photo_url: user.photo_url || null,
      updated_at: new Date().toISOString(),
    }, { 
      onConflict: 'telegram_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('Auth Error:', error);
    throw new Error('Failed to authenticate user');
  }

  return dbUser;
}