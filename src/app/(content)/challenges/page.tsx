"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Poll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionTimer } from '@/components/question-timer';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useUser } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Trophy, BrainCircuit, RefreshCw, Loader2, CalendarX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getRandomChallenges, getUserGlobalStats, completeDailyChallenge } from '@/app/actions/challenge';
import WebApp from '@twa-dev/sdk';

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

// مكون السؤال (داخلي)
function QuizQuestion({ item, onAnswered }: { item: Poll, onAnswered: (isCorrect: boolean) => void }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  const handleTimeUp = () => {
    if (!isAnswered) {
      setIsAnswered(true);
      toast({ variant: "destructive", title: "انتهى الوقت!" });
      onAnswered(false);
    }
  };
  
  const handleVote = () => {
    if (isAnswered) return;
    if (selectedOption) {
        setIsAnswered(true);
        const isCorrect = String(selectedOption) === String(item.correctOptionId);
        if (isCorrect) {
          toast({ title: "إجابة صحيحة!" });
        } else {
          toast({ variant: "destructive", title: "إجابة خاطئة" });
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
                <CardTitle className="text-2xl md:text-3xl font-headline font-bold">{item.question}</CardTitle>
            </div>
            {!isAnswered && (
              <QuestionTimer duration={15} onTimeUp={handleTimeUp} isPaused={isAnswered} />
            )}
          </div>
          <CardDescription>
            {isAnswered ? "تم تسجيل إجابتك." : "اختر الإجابة الصحيحة."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn("grid gap-4", hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2")}>
            {item.options.map((option) => {
              const isSelected = option.id === selectedOption;
              const isCorrectOption = option.id === item.correctOptionId;
              
              if (isAnswered) {
                 const isWrongChoice = isSelected && !isCorrectOption;
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
                  <div key={option.id} onClick={() => !isAnswered && setSelectedOption(option.id)}
                    className={cn("rounded-lg border-2 bg-card/50 overflow-hidden cursor-pointer transition-all",
                      isSelected ? "border-primary shadow-lg" : "border-border hover:border-primary/50",
                      isAnswered && "cursor-not-allowed opacity-70")}>
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
                  <Button variant={isSelected ? 'default' : 'secondary'}
                    className="w-full justify-start h-auto py-3 px-4 text-left"
                    onClick={() => !isAnswered && setSelectedOption(option.id)}
                    disabled={isAnswered}>
                    {option.text}
                  </Button>
                </div>
              );
            })}
          </div>
          {!isAnswered && (
            <div className="mt-6 text-center">
              <Button size="lg" onClick={handleVote} disabled={!selectedOption}>
                تأكيد الإجابة
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
  );
}


export default function DailyChallengePage() {
    const { user, awardPoints } = useUser();
    const { toast } = useToast();

    const [questions, setQuestions] = useState<Poll[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(true);
    const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'finished' | 'completed_today'>('not_started');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
    const [globalStats, setGlobalStats] = useState<{ beatPercentage: number, totalPoints: number } | null>(null);

    // Ad effect for results screen
    useEffect(() => {
        let adShown = false;
        if (quizState === 'finished') {
            try {
                if (WebApp.isVersionAtLeast('6.9')) {
                    WebApp.showBannerAd({}).then(isShown => {
                        adShown = isShown;
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }
        return () => {
            if (adShown) {
                WebApp.hideBannerAd();
            }
        }
    }, [quizState]);

    // التحقق هل أكمل التحدي اليوم؟
    const hasPlayedToday = useMemo(() => {
        if (!user?.last_daily_challenge_at) return false;
        const lastDate = new Date(user.last_daily_challenge_at);
        const today = new Date();
        return lastDate.getDate() === today.getDate() &&
               lastDate.getMonth() === today.getMonth() &&
               lastDate.getFullYear() === today.getFullYear();
    }, [user]);

    useEffect(() => {
        const fetchQuestions = async () => {
            setLoadingQuestions(true);
            const data = await getRandomChallenges();
            setQuestions(data);
            setLoadingQuestions(false);
            
            // تحديث الحالة إذا كان قد لعب اليوم
            if (hasPlayedToday) {
                setQuizState('completed_today');
            }
        };
        fetchQuestions();
    }, [hasPlayedToday]);

    const startQuiz = () => {
        if (!user) return;
        setQuizState('in_progress');
        setCurrentQuestionIndex(0);
        setAnswers([]);
    };

    const handleAnswer = async (isCorrect: boolean) => {
        setAnswers(prev => [...prev, { questionId: questions[currentQuestionIndex].id, isCorrect }]);
        
        // === الحل لمشكلة البطء ===
        // نحدد النقاط فوراً في الواجهة قبل الاتصال بالسيرفر
        if (isCorrect && user) {
            // هذا الاستدعاء سيحدث واجهة المستخدم فوراً (Optimistic)
            await awardPoints(1, 'daily_challenge_correct', { question_id: questions[currentQuestionIndex].id });
        }
        
        setTimeout(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                finishQuiz();
            }
        }, 1500);
    };

    const finishQuiz = async () => {
        setQuizState('finished');
        
        // تسجيل اكتمال التحدي في قاعدة البيانات
        if (user) {
            await completeDailyChallenge(user.id);
            const stats = await getUserGlobalStats(user.id);
            setGlobalStats(stats);
        }
    };

    const totalScore = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;

    if (loadingQuestions) {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        );
    }

    // حالة: لعب اليوم بالفعل
    if (quizState === 'completed_today') {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CalendarX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <CardTitle className="text-2xl font-bold">اكتمل تحدي اليوم!</CardTitle>
                        <CardDescription>
                            لقد أتممت التحدي اليومي بالفعل. عد غداً لتحدي جديد أو جرب اختبارات أخرى لزيادة نقاطك.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" onClick={() => window.location.href = '/quizzes'}>
                            الذهاب للاختبارات
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (quizState === 'not_started') {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
                <Card className="max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline font-bold mb-2">التحدي اليومي</CardTitle>
                        <CardDescription className="text-lg">
                            سلسلة من {totalQuestions} أسئلة عشوائية. يمكنك إكمال هذا التحدي مرة واحدة يومياً.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" onClick={startQuiz} disabled={!user}>
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
                <Card className="max-w-lg text-center p-6 md:p-8">
                    <CardHeader>
                        <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
                        <CardTitle className="text-3xl font-headline font-bold mb-2">رائع!</CardTitle>
                        <CardDescription className="text-lg">
                            أجبت بشكل صحيح على {totalScore} من {totalQuestions}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg space-y-2">
                            <p className="text-lg font-semibold">مجموع نقاطك الحالي:</p>
                            <div className="text-2xl font-bold text-primary">
                                {user?.points || 0}
                            </div>
                        </div>
                        <Button size="lg" className="w-full" onClick={() => window.location.href = '/quizzes'}>
                           الذهاب للمزيد من الاختبارات
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const currentQuestion = questions[currentQuestionIndex];

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
