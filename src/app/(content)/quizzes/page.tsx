'use client';

import { useState } from 'react';
import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Poll } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const difficultyLevels: Exclude<Poll['difficulty'], undefined>[] = ['easy', 'medium', 'hard'];
const difficultyTranslations: Record<typeof difficultyLevels[number], string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب'
};

export default function QuizzesPage() {
  const quizzes = MOCK_DATA.filter(item => item.type === 'challenge' && item.difficulty);
  const categories = ['islamic', ...Array.from(new Set(quizzes.map(p => p.category))).filter(c => c !== 'islamic')];

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Poll['difficulty']>('easy');

  const filteredQuizzes = quizzes.filter(quiz => quiz.category === selectedCategory && quiz.difficulty === selectedDifficulty);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold mb-2">الاختبارات المعرفية</h1>
        <p className="text-muted-foreground text-lg">تحدى معلوماتك في مختلف المجالات والمستويات.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 border rounded-lg bg-card/50 md:sticky top-20 z-40">
        <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">اختر الفئة</label>
            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="اختر فئة" />
                </SelectTrigger>
                <SelectContent>
                    {categories.map(category => (
                        <SelectItem key={category} value={category}>
                            {categoryTranslations[category] || category}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex-1 space-y-2">
           <label className="text-sm font-medium">اختر مستوى الصعوبة</label>
            <Tabs defaultValue="easy" onValueChange={(val) => setSelectedDifficulty(val as Poll['difficulty'])} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    {difficultyLevels.map(level => (
                        <TabsTrigger key={level} value={level}>{difficultyTranslations[level]}</TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
      </div>

        <div>
            {filteredQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredQuizzes.map(item => (
                <PollCard key={item.id} item={item} />
                ))}
            </div>
            ) : (
            <div className="text-center text-muted-foreground mt-16 p-8 border-2 border-dashed rounded-lg">
                <p className="text-lg">لا توجد اختبارات في هذا المستوى حاليًا.</p>
                <p>جرب فئة أو مستوى صعوبة آخر.</p>
            </div>
            )}
        </div>
    </div>
  );
}
