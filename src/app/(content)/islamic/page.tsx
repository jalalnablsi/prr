'use client';

import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Poll } from '@/lib/types';

export default function IslamicPage() {
  const items = MOCK_DATA.filter(item => item.category === 'islamic');
  
  const levels: Exclude<Poll['difficulty'], undefined>[] = ['easy', 'medium', 'hard'];
  const levelTranslations: Record<typeof levels[number], string> = {
    easy: 'سهل',
    medium: 'متوسط',
    hard: 'صعب'
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">أسئلة إسلامية</h1>
      <p className="text-muted-foreground mb-8">اختبر معرفتك في العلوم الإسلامية. اختر مستوى الصعوبة.</p>
      
      <Tabs defaultValue="easy" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-1/2 mx-auto mb-8">
          {levels.map(level => (
            <TabsTrigger key={level} value={level}>{levelTranslations[level]}</TabsTrigger>
          ))}
        </TabsList>
        {levels.map(level => {
          const filteredItems = items.filter(item => item.difficulty === level);
          return (
            <TabsContent key={level} value={level}>
              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map(item => (
                    <PollCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground mt-16 p-8 border-2 border-dashed rounded-lg">
                  <p className="text-lg">لا توجد أسئلة في هذا المستوى حاليًا.</p>
                  <p>سيقوم المسؤول بإضافة المزيد قريباً.</p>
                </div>
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  );
}
