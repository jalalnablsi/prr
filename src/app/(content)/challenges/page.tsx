'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MOCK_DATA } from "@/lib/data";
import type { Poll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionTimer } from '@/components/question-timer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Trophy, BrainCircuit, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

function QuizQuestion({ item, onAnswered }: { item: Poll, onAnswered: (isCorrect: boolean) => void }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      toast({
        variant: "destructive",
        title: "انتهى الوقت!",
        description: "لم تختر إجابة في الوقت المحدد.",
      });
      onAnswered(false);
    }
  };
  
  const handleVote = () => {
    if (isAnswered) return;
    if (selectedOption) {
        setIsAnswered(true);
        const isCorrect = selectedOption === item.correctOptionId;
        if (isCorrect) {
          toast({
            title: "إجابة صحيحة!",
            description: "أحسنت! لننتقل للسؤال التالي.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "إجابة خاطئة",
            description: "حظ أوفر في المرة القادمة. تم تظليل الإجابة الصحيحة.",
          });
        }
        onAnswered(isCorrect);
    }
  };

  const hasImages = item.options.some(opt => opt.imageUrl);

  return (
    <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <div>
                 <Badge variant="secondary" className="mb-2">
                    <BrainCircuit className="h-4 w-4 ms-1" />
                    {categoryTranslations[item.category] || item.category}
                </Badge>
                <CardTitle className="text-3xl font-headline font-bold">{item.question}</CardTitle>
            </div>
            {!isAnswered && (
              <QuestionTimer duration={15} onTimeUp={handleTimeUp} isPaused={isAnswered} />
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            {isAnswered ? "تم تسجيل إجابتك. الإجابة الصحيحة مظللة." : "اختر الإجابة التي تعتقد أنها صحيحة."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2",
            !hasImages && "grid-cols-1"
          )}>
            {item.options.map((option) => {
              const isSelected = option.id === selectedOption;
              const isCorrectOption = option.id === item.correctOptionId;
              
              if (isAnswered) {
                 const isUserChoice = isSelected;
                 const isWrongChoice = isUserChoice && !isCorrectOption;

                return (
                  <div key={option.id} className={cn(
                      "p-4 rounded-lg border-2 transition-all",
                      isCorrectOption ? "border-primary bg-primary/10" :
                      isWrongChoice ? "border-destructive bg-destructive/10" : "border-transparent bg-card/50"
                  )}>
                    {option.imageUrl && (
                      <div className="relative w-full aspect-video mb-4 rounded-md overflow-hidden">
                        <Image src={option.imageUrl} alt={option.text} fill className="object-cover" />
                      </div>
                    )}
                     <p className="flex items-center gap-2 font-medium">
                           {isCorrectOption && <CheckCircle className="h-5 w-5 text-primary" />}
                           {isWrongChoice && <XCircle className="h-5 w-5 text-destructive" />}
                          <span>{option.text}</span>
                     </p>
                  </div>
                )
              }
              
              if(hasImages) {
                 return (
                  <div 
                    key={option.id} 
                    onClick={() => !isAnswered && setSelectedOption(option.id)}
                    className={cn(
                      "rounded-lg border-2 bg-card/50 overflow-hidden cursor-pointer transition-all",
                      isSelected ? "border-primary shadow-lg" : "border-border hover:border-primary/50",
                      isAnswered && "cursor-not-allowed opacity-70"
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
                    onClick={() => !isAnswered && setSelectedOption(option.id)}
                    disabled={isAnswered}
                  >
                    {option.text}
                  </Button>
                </div>
              );
            })}
          </div>
          {!isAnswered && (
            <div className="mt-6 text-center">
              <Button size="lg" onClick={handleVote} disabled={!selectedOption || isAnswered}>
                تأكيد الإجابة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
  );
}


export default function DailyChallengePage() {
    const dailyChallenges = useMemo(() => MOCK_DATA.filter(item => item.type === 'challenge' && item.category !== 'islamic'), []);
    
    const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'finished'>('not_started');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);

    const startQuiz = () => {
        setQuizState('in_progress');
        setCurrentQuestionIndex(0);
        setAnswers([]);
    };

    const handleAnswer = (isCorrect: boolean) => {
        setAnswers(prev => [...prev, { questionId: dailyChallenges[currentQuestionIndex].id, isCorrect }]);
        
        setTimeout(() => {
            if (currentQuestionIndex < dailyChallenges.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setQuizState('finished');
            }
        }, 1500);
    };
    
    const restartQuiz = () => {
        setQuizState('not_started');
        setCurrentQuestionIndex(0);
        setAnswers([]);
    };

    const totalScore = useMemo(() => answers.filter(a => a.isCorrect).length, [answers]);
    const totalQuestions = dailyChallenges.length;

    const averageBeatPercentage = useMemo(() => {
        if (answers.length === 0) return 0;
        const correctAnswers = answers.filter(a => a.isCorrect);
        if (correctAnswers.length === 0) return 0;

        const answeredQuestionIds = correctAnswers.map(a => a.questionId);
        const answeredQuestions = dailyChallenges.filter(q => answeredQuestionIds.includes(q.id));
        
        const totalBeatPercentage = answeredQuestions.reduce((acc, q) => acc + (q.beatPercentage || 0), 0);
        return Math.round(totalBeatPercentage / answeredQuestions.length);
    }, [answers, dailyChallenges]);

    if (quizState === 'not_started') {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline font-bold mb-2">التحدي اليومي</CardTitle>
                        <CardDescription className="text-lg">
                            استعد لاختبار معلوماتك في سلسلة من {totalQuestions} أسئلة سريعة عبر فئات مختلفة.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" onClick={startQuiz}>
                            ابدأ التحدي
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (quizState === 'finished') {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-lg text-center p-8">
                    <CardHeader>
                        <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
                        <CardTitle className="text-3xl font-headline font-bold mb-2">اكتمل التحدي!</CardTitle>
                        <CardDescription className="text-lg">
                            لقد أجبت بشكل صحيح على {totalScore} من {totalQuestions} أسئلة.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                            <p className="text-lg font-semibold">أداء رائع!</p>
                            <p className="text-muted-foreground">لقد تفوقت على {averageBeatPercentage}% من المشاركين في الأسئلة التي أجبت عليها بشكل صحيح.</p>
                        </div>
                        <Button size="lg" onClick={restartQuiz}>
                           <RefreshCw className="ms-2 h-4 w-4" />
                            إعادة التحدي
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = dailyChallenges[currentQuestionIndex];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto mb-4">
                <p className="text-center text-muted-foreground mb-2">السؤال {currentQuestionIndex + 1} من {totalQuestions}</p>
                <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} />
            </div>
            <QuizQuestion 
                key={currentQuestion.id}
                item={currentQuestion} 
                onAnswered={handleAnswer} 
            />
        </div>
    );
}
