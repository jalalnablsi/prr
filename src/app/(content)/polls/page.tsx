'use client';

import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Poll } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
  // We show polls and predictions on this page
  const polls = MOCK_DATA.filter(item => item.type === 'poll' || item.type === 'prediction');
  const categories = ['general', ...Array.from(new Set(polls.map(p => p.category))).filter(c => c !== 'general' && c !== 'islamic')];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">استطلاعات وتوقعات المجتمع</h1>
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
          const filteredItems = polls.filter(item => item.category === category);
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
