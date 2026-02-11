"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import type { Poll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionTimer } from '@/components/question-timer';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useUser } from '@/context/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Trophy, BrainCircuit, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebApp from '@twa-dev/sdk';

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
        const isCorrect = String(selectedOption) === String(item.correctOptionId);
        
        if (isCorrect) {
          toast({
            title: "إجابة صحيحة!",
            description: "أحسنت! لننتقل للسؤال التالي.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "إجابة خاطئة",
            description: "حظ أوفر في المرة القادمة.",
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
                <CardTitle className="text-2xl md:text-3xl font-headline font-bold">{item.question}</CardTitle>
            </div>
            {!isAnswered && (
              <QuestionTimer duration={15} onTimeUp={handleTimeUp} isPaused={isAnswered} />
            )}
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            {isAnswered ? "تم تسجيل إجابتك." : "اختر الإجابة التي تعتقد أنها صحيحة."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2",
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

function AdBanner({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-lg mx-auto mt-4 p-4 rounded-lg bg-muted/50 border-2 border-dashed border-border text-center", className)}>
      <p className="font-bold text-primary">محاكاة إعلان بانر</p>
      <p className="text-sm text-muted-foreground">سيظهر إعلان البانر هنا في النسخة النهائية.</p>
    </div>
  );
}

export default function QuizzesPage() {
  const { user, awardPoints } = useUser();
  const { toast } = useToast();

  const [filteredQuizzes, setFilteredQuizzes] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string>('islamic');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Poll['difficulty']>('easy');
  
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'finished'>('not_started');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const adShownRef = useRef(false);

  // Ad effect for results screen
  useEffect(() => {
    if (quizState === 'finished') {
        try {
            if (WebApp && WebApp.isVersionAtLeast && WebApp.isVersionAtLeast('6.9')) {
                WebApp.showBannerAd().then(isShown => {
                    if (isShown) {
                        adShownRef.current = true;
                    }
                }).catch(e => console.error("Banner Ad Error:", e));
            }
        } catch (e) {
            console.error("showBannerAd sync error:", e);
        }
    }
    
    return () => {
        if (adShownRef.current) {
            try {
                if (WebApp && WebApp.hideBannerAd) {
                    WebApp.hideBannerAd().catch(e => console.error("Hide Banner Ad Error:", e));
                }
            } catch (e) {
                console.error("hideBannerAd sync error:", e);
            }
            adShownRef.current = false;
        }
    }
  }, [quizState]);


  useEffect(() => {
    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('content')
            .select('category')
            .eq('type', 'challenge');

        if (error) {
            console.error('Error fetching categories:', error);
        } else if (data) {
            const uniqueCats = Array.from(new Set(data.map(p => p.category as string)));
            const sortedCats = ['islamic', ...uniqueCats.filter(c => c !== 'islamic')];
            setAllCategories(sortedCats);
        }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!selectedCategory || !selectedDifficulty) return;
      setLoading(true);
      
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'challenge')
        .eq('category', selectedCategory)
        .eq('difficulty', selectedDifficulty);

      if (error) {
        console.error('Error fetching quizzes:', error);
        toast({ variant: "destructive", title: "خطأ في جلب البيانات" });
        setFilteredQuizzes([]);
      } else {
        const mappedData = data?.map(item => ({
          ...item,
          correctOptionId: item.correct_option_id,
        })) || [];
        
        // Shuffle the array and take the first 10 questions
        const shuffled = [...mappedData].sort(() => 0.5 - Math.random());
        setFilteredQuizzes(shuffled.slice(0, 10));
      }
      setLoading(false);
    };

    fetchQuizzes();
  }, [selectedCategory, selectedDifficulty, toast]);
  
  const startQuiz = () => {
      if (filteredQuizzes.length === 0) {
          toast({
              variant: "destructive",
              title: "لا توجد أسئلة",
              description: "يرجى اختيار فئة ومستوى صعوبة مختلفين.",
          });
          return;
      }
      setQuizState('in_progress');
      setCurrentQuestionIndex(0);
      setAnswers([]);
  };

  const handleAnswer = async (isCorrect: boolean) => {
      setAnswers(prev => [...prev, { questionId: filteredQuizzes[currentQuestionIndex].id, isCorrect }]);
      
      if (isCorrect && user) {
          await awardPoints(1, 'quiz_correct', { 
            category: selectedCategory, 
            difficulty: selectedDifficulty 
          });
      }
      
      setTimeout(() => {
          if (currentQuestionIndex < filteredQuizzes.length - 1) {
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

  const totalScore = answers.filter(a => a.isCorrect).length;
  const totalQuestions = filteredQuizzes.length;

  if (quizState === 'not_started') {
      return (
          <div className="container mx-auto px-4 py-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-headline font-bold mb-2">الاختبارات المعرفية</h1>
                <p className="text-muted-foreground text-lg">تحدى معلوماتك واجمع النقاط.</p>
              </div>

              <Card className="max-w-2xl mx-auto">
                  <CardHeader>
                      <CardTitle>اختر اختبارك</CardTitle>
                      <CardDescription>اختر فئة ومستوى صعوبة لبدء اللعب.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium">اختر الفئة</label>
                            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="اختر فئة" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCategories.map(category => (
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
                      
                      {loading ? (
                        <div className='text-center pt-4'>
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </div>
                      ) : (
                        <>
                          {filteredQuizzes.length === 0 && (
                             <p className="text-center text-muted-foreground pt-4">
                              {'لا توجد أسئلة بهذه المواصفات حالياً.'}
                            </p>
                          )}
                        </>
                      )}

                      <Button size="lg" onClick={startQuiz} className="w-full" disabled={loading || filteredQuizzes.length === 0}>
                          ابدأ الاختبار
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
                      <CardTitle className="text-3xl font-headline font-bold mb-2">اكتمل الاختبار!</CardTitle>
                      <CardDescription className="text-lg">
                          لقد أجبت بشكل صحيح على {totalScore} من {totalQuestions} أسئلة.
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg space-y-2">
                          <p className="text-lg font-semibold">مجموع نقاطك:</p>
                          <div className="text-2xl font-bold text-primary">
                              {user?.points || 0}
                          </div>
                      </div>
                      <Button size="lg" onClick={restartQuiz} className="w-full">
                         <RefreshCw className="ms-2 h-4 w-4" />
                          العودة لقائمة الاختبارات
                      </Button>
                      <AdBanner />
                  </CardContent>
              </Card>
          </div>
      )
  }

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
    );
  }

  const currentQuestion = filteredQuizzes[currentQuestionIndex];
  if (!currentQuestion) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <p>حدث خطأ ما. جارٍ العودة...</p>
            {setTimeout(() => restartQuiz(), 2000)}
        </div>
    );
  }

  return (
      <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto mb-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-center text-muted-foreground">السؤال {currentQuestionIndex + 1} من {totalQuestions}</p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">إنهاء الاختبار</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                سيؤدي هذا إلى إنهاء الاختبار الحالي والعودة إلى شاشة الاختيار.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={restartQuiz}>
                                إنهاء الاختبار
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
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
