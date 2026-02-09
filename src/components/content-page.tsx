"use client";

import { useMemo } from 'react';
import Image from 'next/image';
import type { Poll } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CommentSection } from './comment-section';
import { cn } from '@/lib/utils';
import { CheckCircle, Trophy, Users, MessageSquare } from 'lucide-react';
import { Badge } from './ui/badge';


const categoryTranslations: Record<Poll['category'], string> = {
  sports: 'رياضة',
  games: 'ألعاب',
  math: 'رياضيات',
  puzzles: 'ألغاز',
  islamic: 'إسلامية',
  tech: 'تقنية',
  general: 'عام',
  science: 'علوم',
};

const difficultyTranslations: Record<Exclude<Poll['difficulty'], undefined>, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب'
}

export function ContentPage({ item }: { item: Poll }) {
  const totalVotes = useMemo(() => {
    return item.options.reduce((sum, option) => sum + option.votes, 0);
  }, [item.options]);
  const isQuiz = item.correctOptionId != null;
  const hasImages = item.options.some(opt => opt.imageUrl);
  
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className='flex justify-between items-center mb-4'>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <Badge variant="secondary">{categoryTranslations[item.category] || item.category}</Badge>
                {item.difficulty && <Badge variant="outline">{difficultyTranslations[item.difficulty]}</Badge>}
            </div>
          </div>
          <CardTitle className="text-3xl font-headline font-bold">{item.question}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            {isQuiz ? "هذا اختبار. النتائج النهائية موضحة أدناه." : "هذا استطلاع رأي. النتائج النهائية موضحة أدناه."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2",
            !hasImages && "grid-cols-1"
          )}>
            {item.options.map((option) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              const isCorrectOption = option.id === item.correctOptionId;

              return (
                <div key={option.id} className={cn(
                    "p-4 rounded-lg border-2",
                    isQuiz && isCorrectOption ? "border-primary bg-primary/10" : "border-transparent bg-card/50"
                )}>
                  {option.imageUrl && (
                    <div className="relative w-full aspect-video mb-4 rounded-md overflow-hidden">
                      <Image src={option.imageUrl} alt={option.text} fill className="object-cover" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm font-medium">
                      <p className="flex items-center gap-2">
                         {isQuiz && isCorrectOption && <CheckCircle className="h-4 w-4 text-primary" />}
                        <span>{option.text}</span>
                      </p>
                      <p className="font-bold">{percentage.toFixed(0)}%</p>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={cn(isQuiz && isCorrectOption && '[&>div]:bg-primary')} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
           {isQuiz && item.beatPercentage != null && (
            <Card className="mt-6 bg-primary/10 border-primary/30">
              <CardHeader className="text-center items-center">
                <Trophy className="h-10 w-10 text-primary mb-2" />
                <CardTitle>أداء رائع!</CardTitle>
                <CardDescription className="text-base">
                  لقد تفوقت على {item.beatPercentage}% من المشاركين.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-muted-foreground">
             <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{totalVotes.toLocaleString()} مشاركة</span>
            </div>
            <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>{item.comments.length} تعليق</span>
            </div>
        </CardFooter>
      </Card>

      <CommentSection comments={item.comments} contentId={item.id} contentType={item.type} />
    </div>
  );
}
