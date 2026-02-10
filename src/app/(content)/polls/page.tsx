// PollsPage.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient'; // استيراد العميل
import type { Poll } from '@/lib/types'; // تأكد أن نوع Poll يطابق بيانات قاعدة البيانات
import { PollCard } from "@/components/poll-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
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
  
  useEffect(() => {
    setIsClient(true);
    const fetchPolls = async () => {
      // جلب البيانات حيث النوع هو 'poll'
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'poll')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching polls:', error);
      } else if (data) {
        setPolls(data as Poll[]);
      }
      setLoading(false);
    };

    fetchPolls();
  }, []);

  const categories = useMemo(() => {
    if (loading || polls.length === 0) return ['general'];
    const uniqueCats = Array.from(new Set(polls.map(p => p.category)));
    return ['general', ...uniqueCats.filter(c => c !== 'general')];
  }, [polls, loading]);

  const shuffledPolls = useMemo(() => {
    if (!isClient) return polls;
    return [...polls].sort(() => Math.random() - 0.5);
  }, [polls, isClient]);

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">استطلاعات المجتمع</h1>
      <p className="text-muted-foreground mb-8">شارك بصوتك، أدلي برأيك، وشاهد ما يفكر فيه الآخرون.</p>
      
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
                    <PollCard key={item.id} item={item} />
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
