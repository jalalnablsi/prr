// src/lib/supabaseServer.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'; 
// ^^^ قمنا بتغيير اسم الاستيراد إلى createSupabaseClient لتجنب التضارب

export const createClient = () => {
  return createSupabaseClient( // استخدام الاسم الجديد هنا
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};