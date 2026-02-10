'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import type { Poll } from '@/lib/types'; 
import { PollCard } from "@/components/poll-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2 } from "lucide-react";
import { useAuth } from '@/context/auth-context'; // جلب بيانات المستخدم

const categoryTranslations: Record<string, string> = {
  sports: 'رياضة',
  games: 'ألعاب',
  math: 'رياضيات',
  puzzles: 'ألغاز',
  islamic: 'إسلامية',
  tech: 'تقنية',
  general: 'عام',
  science: 'علوم',
};

export default function PollsPage() {
  const { user } = useAuth(); // نحتاج معرف المستخدم
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  // خريطة لتخزين: { poll_id: option_id }
  const [userVotesMap, setUserVotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
    const fetchData = async () => {
      setLoading(true);

      // 1. جلب الاستطلاعات
      const { data: pollsData, error: pollsError } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'poll')
        .order('created_at', { ascending: false });

      if (pollsError) {
        console.error('Error fetching polls:', pollsError);
      } else if (pollsData) {
        setPolls(pollsData as Poll[]);
      }

      // 2. جلب أصوات المستخدم الحالي (إذا كان مسجلاً)
      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('user_votes')
          .select('content_id, option_id')
          .eq('user_id', user.id);
        
        if (votesData && !votesError) {
          // تحويل البيانات إلى كائن للوصول السريع
          const map: Record<string, string> = {};
          votesData.forEach(v => {
            map[v.content_id] = v.option_id;
          });
          setUserVotesMap(map);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const categories = useMemo(() => {
    if (loading || polls.length === 0) return ['general'];
    const uniqueCats = Array.from(new Set(polls.map(p => p.category)));
    return ['general', ...uniqueCats.filter(c => c !== 'general')];
  }, [polls, loading]);

  const shuffledPolls = useMemo(() => {
    if (!isClient) return polls;
    return [...polls].sort(() => Math.random() - 0.5);
  }, [polls, isClient]);

  if (loading) return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">استطلاعات المجتمع</h1>
      <p className="text-muted-foreground mb-8">شارك بصوتك، أدلي برأيك.</p>
      
      <Tabs defaultValue="general" className="w-full">
        <ScrollArea className="w-full pb-4">
          <TabsList className="inline-flex w-max gap-3">
            {categories.map(category => (
              <TabsTrigger key={category} value={category} className="rounded-full data-[state=active]:shadow-lg">
                {categoryTranslations[category] || category}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
        {categories.map(category => {
          const filteredItems = category === 'general' 
            ? shuffledPolls 
            : polls.filter(item => item.category === category);
          return (
            <TabsContent key={category} value={category}>
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    // تمرير الـ prop الجديد
                    <PollCard 
                      key={item.id} 
                      item={item} 
                      votedOptionId={userVotesMap[item.id]} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground mt-16 p-8 border-2 border-dashed rounded-lg">
                  <p className="text-lg">لا توجد استطلاعات في هذه الفئة حاليًا.</p>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  );
}
