
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, BrainCircuit, CheckCircle, XCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import type { Poll } from "@/lib/types";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/auth-context';

// --- الترجمات والثوابت ---
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
};

// --- المكون الرئيسي ---
export function PollCard({ item: initialItem }: { item: Poll }) {
  const { user } = useAuth();
  const [item, setItem] = useState(initialItem);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();

  const isQuiz = item.correctOptionId != null;

  const totalVotes = useMemo(() => {
    let initialVotes = item.options.reduce((sum, option) => sum + option.votes, 0);
    if (selectedOption && !isAnswered) {
        return initialVotes + 1;
    }
    return initialVotes;
  }, [item.options, selectedOption, isAnswered]);

  const handleVote = async () => {
    if (!selectedOption) return;
    
    if (!user) {
        toast({
            variant: "destructive",
            title: "مستخدم غير مسجل",
            description: "يجب عليك تسجيل الدخول للمشاركة.",
        });
        return;
    }

    setIsVoting(true);

    const optimisticItem = {
      ...item,
      options: item.options.map(opt => 
        opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
      )
    };
    
    setItem(optimisticItem);
    setIsAnswered(true);

    const { error } = await supabase.rpc('cast_vote', {
      p_content_id: item.id,
      p_option_id: selectedOption,
      p_user_id: user.id
    });

    if (error) {
      console.error("Vote error:", error);
      
      setItem(initialItem); 
      setIsAnswered(false);

      if (error.message.includes('USER_ALREADY_VOTED')) {
        toast({ 
          variant: "destructive", 
          title: "لقد قمت بالتصويت مسبقاً", 
          description: "لا يمكن التصويت أكثر من مرة لنفس المحتوى." 
        });
        // We still want to show the results even if they voted before
        setIsAnswered(true);
        setItem(initialItem); // Revert to original votes count
      } else {
        toast({ 
          variant: "destructive", 
          title: "حدث خطأ", 
          description: "لم يتم تسجيل صوتك، يرجى المحاولة مرة أخرى." 
        });
      }
    } else {
      const isCorrect = selectedOption === item.correctOptionId;

      if (isQuiz) {
        if (isCorrect) {
          toast({ title: "إجابة صحيحة!", description: "أحسنت!" });
        } else {
          toast({ variant: "destructive", title: "إجابة خاطئة", description: "حظ أوفر في المرة القادمة." });
        }
      } else {
        toast({ title: "تم التصويت بنجاح!", description: "شكرًا لمشاركتك." });
      }
    }
    
    setIsVoting(false);
  };

  const hasImages = item.options.some(opt => opt.imageUrl);

  const getBadgeVariant = (type: Poll['type']) => {
    switch (type) {
      case 'challenge': return 'destructive';
      case 'prediction': return 'secondary';
      case 'poll': default: return 'default';
    }
  };

  const getBadgeContent = (type: Poll['type']) => {
    switch (type) {
      case 'challenge': return 'اختبار';
      case 'prediction': return 'توقع';
      case 'poll': default: return 'استطلاع';
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card/80 transition-all duration-200">
        <CardHeader>
          <div className="flex justify-between items-start mb-2 gap-2">
            <CardTitle className="font-headline text-lg">{item.question}</CardTitle>
            <Badge variant={getBadgeVariant(item.type)} className="shrink-0">
              {getBadgeContent(item.type)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 flex-wrap">
            <Badge variant="outline">{categoryTranslations[item.category] || item.category}</Badge>
            {item.difficulty && (
              <Badge variant="outline" className='gap-1.5'>
                <BrainCircuit className="h-3 w-3" />
                <span>{difficultyTranslations[item.difficulty]}</span>
              </Badge>
            )}
          </div>
           <CardDescription>
            {isQuiz ? "اختر الإجابة الصحيحة." : "شارك بصوتك في هذا الاستطلاع."}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-4">
             <div className={cn(
                "grid gap-3",
                hasImages ? "grid-cols-1" : "grid-cols-1",
             )}>
                {item.options.map((option) => {
                  const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                  const isSelected = option.id === selectedOption;
                  const isCorrectOption = option.id === item.correctOptionId;

                  if (isAnswered) {
                     const isUserChoice = isSelected;
                     const isWrongChoice = isUserChoice && !isCorrectOption;
                     
                    return (
                        <div key={option.id} className={cn(
                            "p-3 rounded-lg border-2 transition-all text-sm",
                            isQuiz && isCorrectOption ? "border-primary bg-primary/10" :
                            isQuiz && isWrongChoice ? "border-destructive bg-destructive/10" :
                            !isQuiz && isUserChoice ? "border-primary bg-primary/10" : "border-transparent bg-card/50"
                        )}>
                            {option.imageUrl && (
                              <div className="relative w-full aspect-video mb-2 rounded-md overflow-hidden">
                                <Image src={option.imageUrl} alt={option.text} fill className="object-cover" />
                              </div>
                            )}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center font-medium">
                                <p className="flex items-center gap-2">
                                    {isQuiz && isCorrectOption && <CheckCircle className="h-4 w-4 text-primary" />}
                                    {isQuiz && isWrongChoice && <XCircle className="h-4 w-4 text-destructive" />}
                                    <span>{option.text}</span>
                                </p>
                                <p className="font-bold">{percentage.toFixed(0)}%</p>
                                </div>
                                <Progress 
                                value={percentage} 
                                className={cn(
                                    'h-2',
                                    isQuiz && isCorrectOption && '[&>div]:bg-primary',
                                    isQuiz && isWrongChoice && '[&>div]:bg-destructive',
                                    !isQuiz && isUserChoice && '[&>div]:bg-primary'
                                )} 
                                />
                            </div>
                        </div>
                    );
                  }

                   if(hasImages) {
                    return (
                        <div 
                        key={option.id} 
                        onClick={() => !isAnswered && !isVoting && setSelectedOption(option.id)}
                        className={cn(
                          "rounded-lg border-2 bg-card/50 overflow-hidden cursor-pointer transition-all",
                          isSelected ? "border-primary shadow-md" : "border-border hover:border-primary/50",
                          isAnswered && "cursor-not-allowed opacity-70"
                        )}
                      >
                         {option.imageUrl && (
                          <div className="relative w-full aspect-video">
                            <Image src={option.imageUrl} alt={option.text} fill className="object-cover" />
                          </div>
                        )}
                        <p className="p-3 font-medium text-center">{option.text}</p>
                      </div>
                    )
                   }

                   return (
                     <Button
                        key={option.id}
                        variant={isSelected ? 'default' : 'secondary'}
                        className="w-full justify-start h-auto py-2.5 px-4 text-left text-sm"
                        onClick={() => !isAnswered && !isVoting && setSelectedOption(option.id)}
                        disabled={isAnswered || isVoting}
                    >
                        {option.text}
                    </Button>
                   )
                })}
             </div>

             {!isAnswered && (
                <Button onClick={handleVote} disabled={!selectedOption || isVoting} className='w-full mt-4'>
                    {isVoting ? 'جاري التسجيل...' : (isQuiz ? 'تأكيد الإجابة' : 'تصويت')}
                </Button>
             )}
        </CardContent>

        <CardFooter className="mt-auto flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{totalVotes.toLocaleString()} مشاركة</span>
          </div>
          <Link href={`/polls/${item.id}`} className="flex items-center gap-2 hover:text-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{item.comments?.length || 0} تعليق</span>
          </Link>
        </CardFooter>
      </Card>
  );
}
