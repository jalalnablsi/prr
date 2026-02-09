"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Poll, PollOption } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CommentSection } from './comment-section';
import { useToast } from '@/hooks/use-toast';
import { QuestionTimer } from './question-timer';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';

export function ContentPage({ item }: { item: Poll }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [options, setOptions] = useState<PollOption[]>(item.options);
  const { toast } = useToast();

  const totalVotes = useMemo(() => {
    return options.reduce((sum, option) => sum + option.votes, 0) + (isAnswered ? 0 : 1);
  }, [options, isAnswered]);

  const isQuiz = item.correctOptionId != null;

  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      toast({
        variant: "destructive",
        title: "انتهى الوقت!",
        description: "لم تختر إجابة في الوقت المحدد.",
      });
    }
  };
  
  const handleVote = () => {
    if (selectedOption || isQuiz) { // Allow submitting without an answer for quizzes (time up)
      setIsAnswered(true);

      if (selectedOption) {
        setOptions(currentOptions =>
          currentOptions.map(opt =>
            opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
          )
        );
      }
      
      const isCorrect = selectedOption === item.correctOptionId;

      if (isQuiz) {
        if (isCorrect) {
          toast({
            title: "إجابة صحيحة!",
            description: "أحسنت! لقد اخترت الإجابة الصحيحة.",
          });
        } else if (selectedOption) { // Only show wrong answer toast if an option was actually selected
          toast({
            variant: "destructive",
            title: "إجابة خاطئة",
            description: "حظ أوفر في المرة القادمة. تم تظليل الإجابة الصحيحة.",
          });
        }
      } else {
        const chosenOptionText = options.find(o => o.id === selectedOption)?.text;
        toast({
          title: "تم التصويت!",
          description: `لقد صوتت لصالح "${chosenOptionText}".`,
        });
      }
    }
  };

  const isChallengeEnded = item.type === 'challenge' && item.endsAt && new Date(item.endsAt) <= new Date();
  const canVote = !isAnswered && !isChallengeEnded;
  const hasImages = options.some(opt => opt.imageUrl);
  
  const getResultDescription = () => {
      if (!isAnswered) {
          return isQuiz ? "اختر الإجابة التي تعتقد أنها صحيحة." : "اختر خيارًا وأدلي بصوتك.";
      }
      if (isQuiz) {
          if (selectedOption === null) return "انتهى الوقت! هذه هي النتائج.";
          return selectedOption === item.correctOptionId ? "أحسنت! هذه هي النتائج حتى الآن." : "إجابة خاطئة. هذه هي النتائج حتى الآن.";
      }
      return "شكرًا لتصويتك! إليك النتائج حتى الآن.";
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="text-3xl font-headline font-bold">{item.question}</CardTitle>
            {isQuiz && !isAnswered && (
              <QuestionTimer duration={15} onTimeUp={handleTimeUp} isPaused={isAnswered} />
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            {getResultDescription()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2",
            !hasImages && "grid-cols-1" // ensure single column when no images
          )}>
            {options.map((option) => {
              const currentVotes = option.id === selectedOption && isAnswered ? option.votes -1 : option.votes
              const userVote = option.id === selectedOption && isAnswered ? 1 : 0
              const percentage = totalVotes > 0 ? ((currentVotes + userVote) / totalVotes) * 100 : 0;
              const isSelected = option.id === selectedOption;
              const isCorrectOption = option.id === item.correctOptionId;

              if (isAnswered) {
                 const isUserChoice = isSelected;
                 const isWrongChoice = isUserChoice && !isCorrectOption;

                return (
                  <div key={option.id} className={cn(
                      "p-4 rounded-lg border-2 transition-all",
                      isQuiz && isCorrectOption ? "border-primary bg-primary/10" :
                      isQuiz && isWrongChoice ? "border-destructive bg-destructive/10" :
                      !isQuiz && isUserChoice ? "border-primary bg-primary/10" : "border-transparent bg-card/50"
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
                           {isQuiz && isWrongChoice && <XCircle className="h-4 w-4 text-destructive" />}
                          <span>{option.text}</span>
                        </p>
                        <p className="font-bold">{percentage.toFixed(0)}%</p>
                      </div>
                      <Progress 
                        value={percentage} 
                        className={cn(
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
                    onClick={() => canVote && setSelectedOption(option.id)}
                    className={cn(
                      "rounded-lg border-2 bg-card/50 overflow-hidden cursor-pointer transition-all",
                      isSelected ? "border-primary shadow-lg" : "border-border hover:border-primary/50",
                      !canVote && "cursor-not-allowed opacity-70"
                    )}
                  >
                     {option.imageUrl && (
                      <div className="relative w-full aspect-video">
                        <Image src={option.imageUrl} alt={option.text} fill className="object-cover" />
                      </div>
                    )}
                    <p className="p-4 font-medium text-center">{option.text}</p>
                  </div>
                 )
              }

              return (
                <div key={option.id}>
                  <Button
                    variant={isSelected ? 'default' : 'secondary'}
                    className="w-full justify-start h-auto py-3 px-4 text-left"
                    onClick={() => canVote && setSelectedOption(option.id)}
                    disabled={!canVote}
                  >
                    {option.text}
                  </Button>
                </div>
              );
            })}
          </div>
          {!isAnswered && (
            <div className="mt-6 text-center">
              <Button size="lg" onClick={handleVote} disabled={!selectedOption || !canVote}>
                {isChallengeEnded ? 'انتهى التحدي' : isQuiz ? 'تأكيد الإجابة' : 'أدلي بصوتي'}
              </Button>
            </div>
          )}
          {isAnswered && !isQuiz && selectedOption && (
            <div className="mt-6 text-center text-sm text-accent p-3 bg-accent/10 rounded-lg">
                لقد صوتت مع {(((options.find(o => o.id === selectedOption)!.votes) / totalVotes) * 100).toFixed(0)}% من المشاركين.
            </div>
          )}
           {isAnswered && isQuiz && selectedOption === item.correctOptionId && item.beatPercentage != null && (
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
      </Card>

      {!isQuiz && <CommentSection comments={item.comments} contentId={item.id} contentType={item.type} />}
    </div>
  );
}
