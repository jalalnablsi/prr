"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { Poll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionTimer } from '@/components/question-timer';
import { useToast } from '@/hooks/use-toast';
import { useAuth as useUser } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, XCircle, Trophy, BrainCircuit, RefreshCw, Loader2, 
  CalendarX, Flame, Star, ArrowRight, Lock, Sparkles 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, 
  AlertDialogTitle, AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import WebApp from '@twa-dev/sdk';

// ─────────────────────────────────────────────────────────────
// 🌐 الثوابت والترجمات
// ─────────────────────────────────────────────────────────────
const CATEGORY_TRANSLATIONS: Record<Poll['category'], string> = {
  sports: 'رياضة',
  games: 'ألعاب',
  math: 'رياضيات',
  puzzles: 'ألغاز',
  islamic: 'إسلامية',
  tech: 'تقنية',
  general: 'عام',
  science: 'علوم',
};

const CHALLENGE_CONFIG = {
  QUESTION_DURATION: 15,
  TRANSITION_DELAY: 1200,
  POINTS_PER_CORRECT: 2,
  BONUS_FOR_PERFECT: 10,
} as const;

// ─────────────────────────────────────────────────────────────
// 🎲 دوال مساعدة
// ─────────────────────────────────────────────────────────────

const isSameDay = (date1: Date | string | null, date2: Date = new Date()): boolean => {
  if (!date1) return false;
  const d1 = new Date(date1);
  return d1.getDate() === date2.getDate() &&
         d1.getMonth() === date2.getMonth() &&
         d1.getFullYear() === date2.getFullYear();
};

const formatCategory = (category: Poll['category']): string => 
  CATEGORY_TRANSLATIONS[category] || category;

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: QuizQuestion (محسّن)
// ─────────────────────────────────────────────────────────────

interface QuizQuestionProps {
  item: Poll;
  onAnswered: (isCorrect: boolean) => void;
  questionNumber: number;
  totalQuestions: number;
}

function QuizQuestion({ item, onAnswered, questionNumber, totalQuestions }: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  const handleTimeUp = useCallback(() => {
    if (!isAnswered) {
      setIsAnswered(true);
      toast({ 
        variant: "destructive", 
        title: "⏰ انتهى الوقت!",
        description: "لم تختر إجابة في الوقت المحدد",
      });
      onAnswered(false);
    }
  }, [isAnswered, onAnswered, toast]);
  
  const handleVote = useCallback(() => {
    if (isAnswered || !selectedOption) return;
    
    setIsAnswered(true);
    const isCorrect = String(selectedOption) === String(item.correctOptionId);
    
    toast({
      variant: isCorrect ? "default" : "destructive",
      title: isCorrect ? "✅ إجابة صحيحة!" : "❌ إجابة خاطئة",
      description: isCorrect 
        ? "أحسنت! +2 نقطة 🎉" 
        : "حظ أوفر، الإجابة الصحيحة مُوضحة الآن",
      duration: 2000,
    });
    
    onAnswered(isCorrect);
  }, [isAnswered, selectedOption, item.correctOptionId, onAnswered, toast]);

  const hasImages = useMemo(() => 
    item.options.some(opt => opt.imageUrl)
  , [item.options]);

  // دعم لوحة المفاتيح
  useEffect(() => {
    if (isAnswered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = parseInt(e.key);
      if (key >= 1 && key <= item.options.length) {
        e.preventDefault();
        setSelectedOption(item.options[key - 1].id);
      }
      if (e.key === 'Enter' && selectedOption) {
        e.preventDefault();
        handleVote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, selectedOption, item.options, handleVote]);

  return (
    <Card className="overflow-hidden shadow-xl border-border/60 bg-card/95 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
          <div className="space-y-2">
            <Badge variant="secondary" className="gap-1.5 font-medium">
              <BrainCircuit className="h-3.5 w-3.5" />
              {formatCategory(item.category)}
            </Badge>
            <CardTitle className="text-xl md:text-2xl font-bold leading-tight">
              {item.question}
            </CardTitle>
          </div>
          {!isAnswered && (
            <QuestionTimer 
              duration={CHALLENGE_CONFIG.QUESTION_DURATION} 
              onTimeUp={handleTimeUp} 
              isPaused={isAnswered} 
            />
          )}
        </div>
        <CardDescription className="flex items-center gap-2 text-sm">
          <span className="font-medium text-primary">سؤال {questionNumber}/{totalQuestions}</span>
          <span className="text-muted-foreground">•</span>
          <span>{isAnswered ? "✓ تم التسجيل" : "اختر الإجابة الصحيحة"}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className={cn(
          "grid gap-3",
          hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2"
        )}>
          {item.options.map((option) => {
            const isSelected = option.id === selectedOption;
            const isCorrectOption = option.id === item.correctOptionId;
            
            if (isAnswered) {
              const isWrongChoice = isSelected && !isCorrectOption;
              return (
                <div 
                  key={option.id} 
                  role="status"
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300",
                    isCorrectOption 
                      ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10" 
                      : isWrongChoice 
                        ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-500/10" 
                        : "border-transparent bg-muted/30 opacity-60"
                  )}
                >
                  {option.imageUrl && (
                    <div className="relative w-full aspect-video mb-3 rounded-lg overflow-hidden">
                      <Image 
                        src={option.imageUrl} 
                        alt={option.text} 
                        fill 
                        className="object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.png';
                        }}
                      />
                    </div>
                  )}
                  <p className="flex items-center gap-2 font-medium">
                    {isCorrectOption && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />}
                    {isWrongChoice && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                    <span className={cn(
                      isCorrectOption ? "text-emerald-700 dark:text-emerald-400" : "",
                      isWrongChoice ? "text-red-700 dark:text-red-400 line-through" : ""
                    )}>
                      {option.text}
                    </span>
                  </p>
                </div>
              );
            }
            
            if (hasImages) {
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedOption(option.id)}
                  disabled={isAnswered}
                  className={cn(
                    "rounded-xl border-2 bg-card/60 overflow-hidden cursor-pointer transition-all duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
                    isSelected 
                      ? "border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/30" 
                      : "border-border hover:border-primary/60",
                    isAnswered && "cursor-not-allowed opacity-50"
                  )}
                >
                  {option.imageUrl && (
                    <div className="relative w-full aspect-video">
                      <Image 
                        src={option.imageUrl} 
                        alt={option.text} 
                        fill 
                        className="object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder.png';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p className={cn(
                    "p-4 font-medium text-center transition-colors",
                    isSelected ? "text-primary" : "text-foreground/90"
                  )}>
                    {option.text}
                  </p>
                </button>
              );
            }

            return (
              <Button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  "w-full justify-start h-auto py-4 px-5 text-right font-medium transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isSelected && "shadow-lg shadow-primary/20"
                )}
                onClick={() => setSelectedOption(option.id)}
                disabled={isAnswered}
              >
                <span className="flex items-center gap-3 w-full">
                  <span className={cn(
                    "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold",
                    isSelected 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-muted-foreground/40 text-muted-foreground"
                  )}>
                    {isSelected && <CheckCircle className="w-4 h-4" />}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </span>
              </Button>
            );
          })}
        </div>
        
        {!isAnswered && (
          <div className="pt-2 text-center">
            <Button 
              size="lg" 
              onClick={handleVote} 
              disabled={!selectedOption}
              className="min-w-[180px] gap-2"
            >
              <span>تأكيد الإجابة</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              💡 تلميح: استخدم الأرقام 1-4 للاختيار السريع
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: AdBanner (محسّن)
// ─────────────────────────────────────────────────────────────

const AdBanner = ({ className }: { className?: string }) => (
  <div 
    role="complementary"
    aria-label="مساحة إعلانية"
    className={cn(
      "w-full max-w-lg mx-auto mt-6 p-5 rounded-xl",
      "bg-gradient-to-br from-muted/60 to-muted/30",
      "border-2 border-dashed border-border/60 text-center",
      "hover:border-primary/40 transition-colors",
      className
    )}
  >
    <div className="space-y-1.5">
      <p className="font-bold text-primary flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4 animate-pulse" />
        مساحة إعلانية
      </p>
      <p className="text-sm text-muted-foreground">
        سيظهر إعلان البانر هنا في النسخة النهائية
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: Confetti (مؤثر احتفالي بسيط)
// ─────────────────────────────────────────────────────────────

const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10px`,
            backgroundColor: ['#4ecdc4', '#ffe66d', '#ff6b6b', '#a569bd', '#51cf66'][Math.floor(Math.random() * 5)],
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 🎮 المكون الرئيسي: DailyChallengePage
// ─────────────────────────────────────────────────────────────

type QuizState = 'not_started' | 'in_progress' | 'finished' | 'completed_today';

export default function DailyChallengePage() {
  const { user, awardPoints, refreshUser } = useUser();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Poll[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [quizState, setQuizState] = useState<QuizState>('not_started');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: string; isCorrect: boolean }>>([]);
  const [globalStats, setGlobalStats] = useState<{ beatPercentage: number; totalPoints: number } | null>(null);
  
  const adShownRef = useRef(false);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // التحقق هل أكمل التحدي اليوم؟ (محسّن)
  const hasPlayedToday = useMemo(() => {
    return isSameDay(user?.last_daily_challenge_at);
  }, [user?.last_daily_challenge_at]);

  // 🔄 مزامنة الحالة مع حالة "تم اللعب اليوم"
  useEffect(() => {
    if (hasPlayedToday && quizState !== 'completed_today' && quizState !== 'finished') {
      setQuizState('completed_today');
    }
  }, [hasPlayedToday, quizState]);

  // 📡 جلب الأسئلة
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!isMountedRef.current) return;
      setLoadingQuestions(true);
      
      try {
        // استبدل هذا باستدعاء API الفعلي
        const data = await fetch('/api/challenges/daily').then(res => res.json());
        setQuestions(data);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        if (isMountedRef.current) {
          toast({ 
            variant: "destructive", 
            title: "خطأ", 
            description: "فشل تحميل التحدي، حاول لاحقاً" 
          });
        }
      } finally {
        if (isMountedRef.current) {
          setLoadingQuestions(false);
        }
      }
    };
    
    if (user && !hasPlayedToday) {
      fetchQuestions();
    }
  }, [user, hasPlayedToday, toast]);

  // 🎯 إدارة الإعلانات
  useEffect(() => {
    if (quizState !== 'finished') return;

    let isAdShown = false;
    
    const showAd = async () => {
      try {
        if (WebApp?.isVersionAtLeast?.('6.9')) {
          const shown = await WebApp.showBannerAd();
          if (shown) {
            isAdShown = true;
            adShownRef.current = true;
          }
        }
      } catch (error) {
        console.warn('Failed to show banner ad:', error);
      }
    };

    showAd();

    return () => {
      if (isAdShown && WebApp?.hideBannerAd) {
        WebApp.hideBannerAd().catch(console.warn);
        adShownRef.current = false;
      }
    };
  }, [quizState]);

  // 🎮 بدء التحدي
  const startQuiz = useCallback(() => {
    if (!user || hasPlayedToday) {
      toast({
        variant: "destructive",
        title: "⚠️ لا يمكن البدء",
        description: "لقد أكملت التحدي اليومي بالفعل",
      });
      return;
    }
    setQuizState('in_progress');
    setCurrentQuestionIndex(0);
    setAnswers([]);
  }, [user, hasPlayedToday, toast]);

  // 🔄 إعادة تعيين
  const resetQuiz = useCallback(() => {
    setQuizState('not_started');
    setCurrentQuestionIndex(0);
    setAnswers([]);
  }, []);

  // ✅ معالجة الإجابة (محسّنة للأداء)
  const handleAnswer = useCallback(async (isCorrect: boolean) => {
    // تسجيل الإجابة
    setAnswers(prev => [...prev, { 
      questionId: questions[currentQuestionIndex]?.id || '', 
      isCorrect 
    }]);

    // منح النقاط فوراً (Optimistic Update)
    if (isCorrect && user) {
      await awardPoints(CHALLENGE_CONFIG.POINTS_PER_CORRECT, 'daily_challenge_correct', { 
        question_id: questions[currentQuestionIndex]?.id 
      });
    }
    
    // الانتقال للسؤال التالي
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        finishQuiz();
      }
    }, CHALLENGE_CONFIG.TRANSITION_DELAY);
  }, [currentQuestionIndex, questions, user, awardPoints]);

  // 🏁 إنهاء التحدي وتسجيله
  const finishQuiz = useCallback(async () => {
    setQuizState('finished');
    
    if (!user) return;
    
    try {
      // تسجيل اكتمال التحدي وتحديث المستخدم
      const response = await fetch('/api/challenges/daily/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          score: answers.filter(a => a.isCorrect).length,
          totalQuestions: questions.length 
        }),
      });
      
      if (response.ok) {
        // ✅ تحديث حالة المستخدم فوراً لمنع إعادة اللعب
        await refreshUser?.();
        
        // جلب الإحصائيات العالمية
        const stats = await fetch(`/api/users/${user.id}/stats`).then(r => r.json());
        setGlobalStats(stats);
        
        // مكافأة الأداء المثالي
        const perfectScore = answers.every(a => a.isCorrect);
        if (perfectScore) {
          await awardPoints(CHALLENGE_CONFIG.BONUS_FOR_PERFECT, 'perfect_daily_challenge');
          toast({
            title: "🌟 أداء مثالي!",
            description: `حصلت على +${CHALLENGE_CONFIG.BONUS_FOR_PERFECT} نقطة مكافأة!`,
          });
        }
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
      toast({
        variant: "destructive",
        title: "تنبيه",
        description: "تم حفظ نتيجتك، لكن حدث خطأ في تحديث الإحصائيات",
      });
    }
  }, [user, answers, questions, awardPoints, refreshUser, toast]);

  // 📊 الحسابات
  const totalScore = useMemo(() => 
    answers.filter(a => a.isCorrect).length
  , [answers]);
  
  const totalQuestions = questions.length;
  const progress = useMemo(() => 
    totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0
  , [currentQuestionIndex, totalQuestions]);
  
  const totalPoints = useMemo(() => 
    (user?.points || 0) + (totalScore * CHALLENGE_CONFIG.POINTS_PER_CORRECT)
  , [user?.points, totalScore]);

  const perfectScore = totalQuestions > 0 && totalScore === totalQuestions;

  // ─────────────────────────────────────────
  // ⏳ حالة: التحميل
  // ─────────────────────────────────────────
  if (loadingQuestions) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">جاري تحضير التحدي...</p>
          <p className="text-muted-foreground">نجهز لك أسئلة مميزة اليوم</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // 🔒 حالة: تم اللعب اليوم (ممنوع إعادة)
  // ─────────────────────────────────────────
  if (quizState === 'completed_today' || (hasPlayedToday && quizState === 'not_started')) {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-md w-full shadow-xl border-border/60 text-center overflow-hidden">
          {/* رأس ملون */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <CalendarX className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">🎉 اكتمل تحدي اليوم!</CardTitle>
          </div>
          
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                أحسنت! لقد أكملت التحدي اليومي بنجاح.
              </p>
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">موعد التحدي القادم:</p>
                <p className="font-bold text-primary text-lg">
                  غدًا في نفس الوقت 🕐
                </p>
              </div>
            </div>

            {/* إحصائيات سريعة */}
            {globalStats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{globalStats.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">نقاطك الكلية</p>
                </div>
                <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{globalStats.beatPercentage}%</p>
                  <p className="text-xs text-muted-foreground">تفوقت على</p>
                </div>
              </div>
            )}

            {/* أزرار الإجراءات */}
            <div className="space-y-3">
              <Button 
                variant="default" 
                className="w-full gap-2"
                onClick={() => window.location.href = '/quizzes'}
              >
                <BrainCircuit className="h-4 w-4" />
                <span>جرب اختبارات أخرى</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => window.location.href = '/leaderboard'}
              >
                <Trophy className="h-4 w-4" />
                <span>شاهد لوحة المتصدرين</span>
              </Button>
            </div>
          </CardContent>
          
          <CardFooter className="justify-center pb-6">
            <Badge variant="secondary" className="gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span>حافظ على سلسلة انتصاراتك!</span>
            </Badge>
          </CardFooter>
        </Card>
      </main>
    );
  }

  // ─────────────────────────────────────────
  // 🎬 حالة: قبل البدء
  // ─────────────────────────────────────────
  if (quizState === 'not_started') {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
        <Card className="max-w-lg w-full shadow-xl border-border/60 overflow-hidden">
          {/* رأس جذاب */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Flame className="h-6 w-6 text-amber-300 animate-pulse" />
                <Sparkles className="h-5 w-5 text-amber-200" />
                <Flame className="h-6 w-6 text-amber-300 animate-pulse" />
              </div>
              <CardTitle className="text-3xl font-bold mb-2">🎯 التحدي اليومي</CardTitle>
              <CardDescription className="text-white/90 text-base">
                {totalQuestions} أسئلة عشوائية • +{CHALLENGE_CONFIG.POINTS_PER_CORRECT} نقطة لكل إجابة صحيحة
              </CardDescription>
            </div>
          </div>
          
          <CardContent className="space-y-6 pt-6">
            {/* معلومات التحدي */}
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">{totalQuestions}</p>
                  <p className="text-xs text-muted-foreground">أسئلة</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">{CHALLENGE_CONFIG.QUESTION_DURATION}ث</p>
                  <p className="text-xs text-muted-foreground">لكل سؤال</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3">
                  <p className="text-2xl font-bold text-primary">1×</p>
                  <p className="text-xs text-muted-foreground">يومياً</p>
                </div>
              </div>

              {/* مكافأة الأداء المثالي */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                <Star className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-sm">
                  <span className="font-bold text-amber-600">مكافأة خاصة:</span> 
                  {' '}+{CHALLENGE_CONFIG.BONUS_FOR_PERFECT} نقطة عند الإجابة على جميع الأسئلة بشكل صحيح!
                </p>
              </div>
            </div>

            {/* زر البدء */}
            <Button 
              size="lg" 
              className="w-full text-lg py-6 gap-2 shadow-lg hover:shadow-xl transition-all"
              onClick={startQuiz}
              disabled={!user}
            >
              {user ? (
                <>
                  <span>🚀 ابدأ التحدي الآن</span>
                  <ArrowRight className="h-5 w-5 rtl:rotate-180" />
                </>
              ) : (
                <span>🔐 سجّل الدخول للبدء</span>
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                يجب تسجيل الدخول للمشاركة في التحدي اليومي
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─────────────────────────────────────────
  // 🏆 حالة: النتائج النهائية
  // ─────────────────────────────────────────
  if (quizState === 'finished') {
    return (
      <>
        <Confetti show={perfectScore} />
        <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
          <Card className="max-w-lg w-full shadow-xl border-border/60 text-center overflow-hidden">
            {/* رأس النتيجة */}
            <div className={cn(
              "p-6 text-white text-center",
              perfectScore 
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" 
                : totalScore >= totalQuestions * 0.7 
                  ? "bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                  : "bg-gradient-to-r from-muted via-muted to-muted"
            )}>
              <motion.div className="w-20 h-20 mx-auto mb-4">
                {perfectScore ? (
                  <div className="relative">
                    <Trophy className="h-16 w-16 text-white drop-shadow-lg" />
                    <Sparkles className="h-6 w-6 text-amber-200 absolute -top-1 -right-1 animate-ping" />
                  </div>
                ) : (
                  <Trophy className="h-16 w-16 text-white/90" />
                )}
              </motion.div>
              <CardTitle className="text-2xl font-bold mb-1">
                {perfectScore ? '🌟 أداء أسطوري!' : totalScore >= totalQuestions * 0.7 ? '✅ ممتاز!' : '💪 جيد!'}
              </CardTitle>
              <p className="text-white/90">
                {totalScore} من {totalQuestions} إجابات صحيحة
              </p>
            </div>
            
            <CardContent className="space-y-6 pt-6">
              {/* بطاقة النقاط */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 space-y-3">
                <p className="font-semibold flex items-center justify-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  مجموع نقاطك
                </p>
                <p className="text-4xl font-bold text-primary">
                  {totalPoints}
                </p>
                {totalScore > 0 && (
                  <p className="text-sm text-muted-foreground">
                    +{totalScore * CHALLENGE_CONFIG.POINTS_PER_CORRECT}
                    {perfectScore && ` +${CHALLENGE_CONFIG.BONUS_FOR_PERFECT} مكافأة`} 
                    {' '}من هذا التحدي
                  </p>
                )}
              </div>

              {/* الإحصائيات */}
              {globalStats && (
                <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <p className="font-medium">📊 إحصائياتك العالمية:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-primary">{globalStats.totalPoints}</p>
                      <p className="text-xs text-muted-foreground">نقاطك الكلية</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-emerald-600">{globalStats.beatPercentage}%</p>
                      <p className="text-xs text-muted-foreground">تفوقت على اللاعبين</p>
                    </div>
                  </div>
                </div>
              )}

              {/* أزرار الإجراءات */}
              <div className="space-y-3">
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={() => window.location.href = '/quizzes'}
                >
                  <BrainCircuit className="h-4 w-4" />
                  <span>المزيد من الاختبارات</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    resetQuiz();
                    // منع العودة للتحدي اليوم
                    if (refreshUser) refreshUser();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>العودة للرئيسية</span>
                </Button>
              </div>
              
              <AdBanner />
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // ─────────────────────────────────────────
  // 🎮 حالة: التحدي الجاري
  // ─────────────────────────────────────────
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-lg font-medium">حدث خطأ في تحميل السؤال</p>
        <Button variant="outline" onClick={resetQuiz}>
          العودة للبداية
        </Button>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 md:py-8">
      {/* شريط التقدم والعناصر العلوية */}
      <div className="max-w-4xl mx-auto mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-medium gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              تحدي يومي
            </Badge>
            <Badge variant="secondary" className="font-medium">
              {CHALLENGE_CONFIG.POINTS_PER_CORRECT} نقطة/إجابة
            </Badge>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <XCircle className="h-4 w-4" />
                <span>إنهاء</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>إنهاء التحدي؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم فقدان تقدمك الحالي. هل أنت متأكد؟
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>متابعة</AlertDialogCancel>
                <AlertDialogAction onClick={resetQuiz} className="bg-destructive hover:bg-destructive/90">
                  نعم، إنهاء
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        {/* شريط التقدم */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>التقدم</span>
            <span>{currentQuestionIndex + 1} / {totalQuestions}</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 transition-all"
            aria-label={`التقدم: ${Math.round(progress)}%`}
          />
        </div>
      </div>

      {/* سؤال الاختبار */}
      <QuizQuestion 
        key={currentQuestion.id}
        item={currentQuestion} 
        onAnswered={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
      />
    </main>
  );
}

// مكون محلي لـ AlertCircle إذا لم يكن مستورداً
const AlertCircle = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);

// مكون بسيط للحركات (بديل لـ framer-motion)
const motion = {
  div: (props: React.HTMLAttributes<HTMLDivElement> & { initial?: any; animate?: any; transition?: any }) => {
    const { initial, animate, transition, ...rest } = props;
    return <div {...rest} />;
  }
};
