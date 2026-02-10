"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, BrainCircuit, CheckCircle, XCircle, Vote } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabaseClient';
import type { Poll } from '@/lib/types';
import { cn } from '@/lib/utils';

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

interface PollCardProps {
  item: Poll;
  votedOptionId?: string;
  onVote: (pollId: string, optionId: string) => void;
}

export function PollCard({ item: initialItem, votedOptionId, onVote }: PollCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [item, setItem] = useState(initialItem);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(!!votedOptionId);
  const [isVoting, setIsVoting] = useState(false);

  const isQuiz = item.correctOptionId != null;

  useEffect(() => {
    // Update internal state if the prop changes
    setIsAnswered(!!votedOptionId);
    if (votedOptionId) {
      setSelectedOption(votedOptionId);
    }
  }, [votedOptionId]);


  const totalVotes = useMemo(() => {
    return item.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  }, [item.options]);

  const handleVote = async () => {
    if (!selectedOption) return;
    if (!user) {
      toast({ variant: "destructive", title: "يجب تسجيل الدخول للتصويت" });
      return;
    }
    if (isAnswered) return;

    setIsVoting(true);

    const originalItem = { ...item };
    const optimisticItem = {
      ...item,
      options: item.options.map(opt => 
        opt.id === selectedOption ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
      )
    };
    setItem(optimisticItem);
    setIsAnswered(true);

    const { data, error } = await supabase.rpc('cast_vote', {
      p_user_id: user.id,
      p_content_id: item.id,
      p_option_id: selectedOption,
      p_points_reward: 0 
    });

    if (error || data === 'USER_ALREADY_VOTED' || data === 'ALREADY_VOTED') {
      setItem(originalItem);
      setIsAnswered(!!votedOptionId); 
      toast({ variant: "destructive", title: "لقد قمت بالتصويت مسبقاً" });
    } else {
      const isCorrect = selectedOption === item.correctOptionId;
      if (isQuiz) {
        toast({ title: isCorrect ? "إجابة صحيحة!" : "إجابة خاطئة" });
      } else {
        toast({ title: "تم تسجيل صوتك!" });
      }
      onVote(item.id, selectedOption); // Notify parent on success
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

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    router.push(`/polls/${item.id}`);
  };

  return (
    <div 
        className="h-full flex flex-col transition-all duration-200 cursor-pointer hover:shadow-lg" 
        onClick={handleCardClick} 
    >
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
                      const currentVotes = option.votes || 0;
                      // Avoid division by zero, and ensure percentage is correct after optimistic update
                      const displayTotalVotes = isAnswered 
                        ? item.options.reduce((sum, opt) => sum + (opt.votes || 0), 0)
                        : totalVotes;
                      const percentage = displayTotalVotes > 0 ? (currentVotes / displayTotalVotes) * 100 : 0;

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
                                        {!isQuiz && isUserChoice && <Vote className="h-4 w-4 text-primary" />}
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
                        )
                      }
                      
                      if(hasImages) {
                        return (
                            <div 
                            key={option.id} 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(!isAnswered && !isVoting) setSelectedOption(option.id); 
                            }}
                            className={cn(
                              "rounded-lg border-2 bg-card/50 overflow-hidden cursor-pointer transition-all",
                              isSelected ? "border-primary shadow-md" : "border-border hover:border-primary/50",
                              (isAnswered || isVoting) && "cursor-not-allowed opacity-70"
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
                        <div key={option.id}>
                          <Button
                            variant={isSelected ? 'default' : 'secondary'}
                            className="w-full justify-start h-auto py-2.5 px-4 text-left text-sm"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if(!isAnswered && !isVoting) setSelectedOption(option.id); 
                            }}
                            disabled={isAnswered || isVoting}
                          >
                            {option.text}
                          </Button>
                        </div>
                      );
                    })}
                 </div>
                 {!isAnswered && (
                    <Button 
                        onClick={(e) => { 
                            e.stopPropagation();
                            handleVote(); 
                        }} 
                        disabled={!selectedOption || isVoting} 
                        className='w-full mt-4'
                    >
                        {isVoting ? 'جاري التسجيل...' : (isQuiz ? 'تأكيد الإجابة' : 'تصويت')}
                    </Button>
                 )}
            </CardContent>
            <CardFooter className="mt-auto flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{totalVotes.toLocaleString()} مشاركة</span>
              </div>
              <div className="flex items-center gap-2 hover:text-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>{item.comments?.length || 0} تعليق</span>
              </div>
            </CardFooter>
        </Card>
    </div>
  );
}
