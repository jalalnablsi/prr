"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import type { Poll } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionTimer } from '@/components/question-timer';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, XCircle, Trophy, BrainCircuit, RefreshCw, 
  Loader2, ArrowRight, AlertCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, 
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebApp from '@twa-dev/sdk';

// ─────────────────────────────────────────────────────────────
// 🌐 الثوابت والترجمات
// ─────────────────────────────────────────────────────────────
const CATEGORY_TRANSLATIONS: Record<string, string> = {
  sports: 'رياضة',
  games: 'ألعاب',
  math: 'رياضيات',
  puzzles: 'ألغاز',
  islamic: 'إسلامية',
  tech: 'تقنية',
  general: 'عام',
  science: 'علوم',
};

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
type Difficulty = typeof DIFFICULTY_LEVELS[number];

const DIFFICULTY_TRANSLATIONS: Record<Difficulty, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب'
};

const QUIZ_CONFIG = {
  QUESTION_DURATION: 15, // seconds
  MAX_QUESTIONS: 10,
  CORRECT_ANSWER_POINTS: 1,
  TRANSITION_DELAY: 1500,
} as const;

// ─────────────────────────────────────────────────────────────
// 🎲 دوال مساعدة (Utilities)
// ─────────────────────────────────────────────────────────────

/**
 * خوارزمية Fisher-Yates لخلط المصفوفات بشكل عشوائي حقيقي
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * تنسيق معرف الفئة للعرض
 */
const formatCategory = (category: string): string => 
  CATEGORY_TRANSLATIONS[category] || category;

/**
 * تنسيق مستوى الصعوبة للعرض
 */
const formatDifficulty = (difficulty: Difficulty): string => 
  DIFFICULTY_TRANSLATIONS[difficulty];

// ─────────────────────────────────────────────────────────────
// 🪝 Custom Hook: useQuizLogic
// ─────────────────────────────────────────────────────────────

interface UseQuizLogicProps {
  quizzes: Poll[];
  onCorrectAnswer?: () => Promise<void>;
  onFinish?: (score: number) => void;
}

const useQuizLogic = ({ quizzes, onCorrectAnswer, onFinish }: UseQuizLogicProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionId: string; isCorrect: boolean }>>([]);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = useMemo(() => quizzes[currentIndex], [quizzes, currentIndex]);
  const totalScore = useMemo(() => answers.filter(a => a.isCorrect).length, [answers]);
  const progress = useMemo(() => 
    quizzes.length > 0 ? ((currentIndex + 1) / quizzes.length) * 100 : 0
  , [currentIndex, quizzes.length]);

  const handleAnswer = useCallback(async (isCorrect: boolean) => {
    // تسجيل الإجابة
    setAnswers(prev => [...prev, { 
      questionId: currentQuestion?.id || '', 
      isCorrect 
    }]);

    // منح النقاط عند الإجابة الصحيحة
    if (isCorrect && onCorrectAnswer) {
      await onCorrectAnswer();
    }

    // الانتقال للسؤال التالي أو إنهاء الاختبار
    setTimeout(() => {
      if (currentIndex < quizzes.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
        onFinish?.(totalScore + (isCorrect ? 1 : 0));
      }
    }, QUIZ_CONFIG.TRANSITION_DELAY);
  }, [currentIndex, quizzes.length, currentQuestion?.id, onCorrectAnswer, onFinish, totalScore]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers([]);
    setIsFinished(false);
  }, []);

  return {
    currentQuestion,
    currentIndex,
    answers,
    totalScore,
    progress,
    isFinished,
    handleAnswer,
    restart,
    totalQuestions: quizzes.length,
  };
};

// ─────────────────────────────────────────────────────────────
// 🪝 Custom Hook: useTelegramAds
// ─────────────────────────────────────────────────────────────

const useTelegramAds = (isActive: boolean) => {
  const adShownRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;

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
  }, [isActive]);

  return { isAdShown: adShownRef.current };
};

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: QuizOption (خيار الإجابة)
// ─────────────────────────────────────────────────────────────

interface QuizOptionProps {
  option: Poll['options'][0];
  isSelected: boolean;
  isCorrect: boolean;
  isAnswered: boolean;
  isImageLayout: boolean;
  onSelect: (optionId: string) => void;
  correctOptionId: string;
}

const QuizOption = ({ 
  option, 
  isSelected, 
  isCorrect, 
  isAnswered, 
  isImageLayout,
  onSelect,
  correctOptionId 
}: QuizOptionProps) => {
  const isTheCorrectOption = option.id === correctOptionId;
  const isUserChoice = isSelected;
  const isWrongChoice = isUserChoice && !isCorrect;

  // حالة العرض بعد الإجابة
  if (isAnswered) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className={cn(
          "p-4 rounded-xl border-2 transition-all duration-300 animate-in fade-in-50",
          isTheCorrectOption 
            ? "border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20 shadow-lg" 
            : isWrongChoice 
              ? "border-red-500 bg-red-500/10 shadow-red-500/20 shadow-lg" 
              : "border-transparent bg-muted/30 opacity-60"
        )}
      >
        {option.imageUrl && (
          <div className="relative w-full aspect-video mb-3 rounded-lg overflow-hidden ring-2 ring-offset-2 ring-transparent transition-all"
               style={{ ringColor: isTheCorrectOption ? '#10b981' : isWrongChoice ? '#ef4444' : 'transparent' }}
          >
            <Image 
              src={option.imageUrl} 
              alt={option.text} 
              fill 
              className="object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-option.png';
              }}
            />
          </div>
        )}
        <p className="flex items-center gap-2 font-medium text-base">
          {isTheCorrectOption && <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" aria-hidden="true" />}
          {isWrongChoice && <XCircle className="h-5 w-5 text-red-500 shrink-0" aria-hidden="true" />}
          <span className={cn(
            isTheCorrectOption ? "text-emerald-700 dark:text-emerald-400" : "",
            isWrongChoice ? "text-red-700 dark:text-red-400 line-through" : ""
          )}>
            {option.text}
          </span>
        </p>
      </div>
    );
  }

  // حالة العرض قبل الإجابة - تخطيط الصور
  if (isImageLayout) {
    return (
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        aria-label={`اختر: ${option.text}`}
        onClick={() => onSelect(option.id)}
        disabled={isAnswered}
        className={cn(
          "rounded-xl border-2 bg-card/60 overflow-hidden cursor-pointer transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
          isSelected 
            ? "border-primary shadow-primary/20 shadow-lg ring-2 ring-primary/30" 
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
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder-option.png';
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

  // حالة العرض قبل الإجابة - تخطيط النصوص
  return (
    <Button
      type="button"
      role="radio"
      aria-checked={isSelected}
      variant={isSelected ? 'default' : 'secondary'}
      className={cn(
        "w-full justify-start h-auto py-4 px-5 text-right font-medium transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "hover:scale-[1.01] active:scale-[0.99]",
        isSelected && "shadow-lg shadow-primary/20"
      )}
      onClick={() => onSelect(option.id)}
      disabled={isAnswered}
    >
      <span className="flex items-center gap-3 w-full">
        <span className={cn(
          "w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors",
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
};

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: QuizQuestion (سؤال الاختبار)
// ─────────────────────────────────────────────────────────────

interface QuizQuestionProps {
  item: Poll;
  onAnswered: (isCorrect: boolean) => void;
  questionNumber: number;
  totalQuestions: number;
}

const QuizQuestion = ({ item, onAnswered, questionNumber, totalQuestions }: QuizQuestionProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const { toast } = useToast();

  const hasImages = useMemo(() => 
    item.options.some(opt => opt.imageUrl)
  , [item.options]);

  const handleTimeUp = useCallback(() => {
    if (!isAnswered) {
      setIsAnswered(true);
      toast({
        variant: "destructive",
        title: "⏰ انتهى الوقت!",
        description: "لم تختر إجابة في الوقت المحدد.",
        duration: 3000,
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
        ? "أحسنت! لننتقل للسؤال التالي." 
        : "حظ أوفر في المرة القادمة، الإجابة الصحيحة مُوضحة الآن.",
      duration: 2500,
    });
    
    onAnswered(isCorrect);
  }, [isAnswered, selectedOption, item.correctOptionId, onAnswered, toast]);

  // دعم لوحة المفاتيح
  useEffect(() => {
    if (isAnswered) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const numericKey = parseInt(e.key);
      if (numericKey >= 1 && numericKey <= item.options.length) {
        e.preventDefault();
        const option = item.options[numericKey - 1];
        setSelectedOption(option.id);
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
    <Card className="overflow-hidden shadow-xl border-border/60">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
          <div className="space-y-2">
            <Badge variant="secondary" className="gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatCategory(item.category)}</span>
            </Badge>
            <CardTitle className="text-2xl md:text-3xl font-headline font-bold leading-tight">
              {item.question}
            </CardTitle>
          </div>
          
          {!isAnswered && (
            <div className="flex items-center gap-2 shrink-0">
              <QuestionTimer 
                duration={QUIZ_CONFIG.QUESTION_DURATION} 
                onTimeUp={handleTimeUp} 
                isPaused={isAnswered} 
              />
            </div>
          )}
        </div>
        
        <CardDescription className="text-base flex items-center gap-2">
          <span className="font-medium text-primary">
            سؤال {questionNumber} من {totalQuestions}
          </span>
          <span className="text-muted-foreground">•</span>
          <span>
            {isAnswered ? "✓ تم تسجيل إجابتك" : "اختر الإجابة الصحيحة"}
          </span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        <div className={cn(
          "grid gap-3.5",
          hasImages ? "grid-cols-1 sm:grid-cols-2" : "space-y-2.5"
        )}>
          {item.options.map((option, index) => (
            <QuizOption
              key={option.id}
              option={option}
              isSelected={selectedOption === option.id}
              isCorrect={option.id === item.correctOptionId}
              isAnswered={isAnswered}
              isImageLayout={hasImages}
              onSelect={setSelectedOption}
              correctOptionId={item.correctOptionId}
            />
          ))}
        </div>
        
        {!isAnswered && (
          <div className="pt-2 text-center">
            <Button 
              size="lg" 
              onClick={handleVote} 
              disabled={!selectedOption || isAnswered}
              className="min-w-[200px] gap-2 transition-all"
            >
              <span>تأكيد الإجابة</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              💡 تلميح: استخدم الأرقام 1-4 للاختيار السريع
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: AdBanner (إعلان تجريبي)
// ─────────────────────────────────────────────────────────────

const AdBanner = ({ className }: { className?: string }) => (
  <div 
    role="complementary"
    aria-label="مساحة إعلانية"
    className={cn(
      "w-full max-w-lg mx-auto mt-6 p-5 rounded-xl bg-gradient-to-br from-muted/60 to-muted/30",
      "border-2 border-dashed border-border/60 text-center transition-all hover:border-primary/40",
      className
    )}
  >
    <div className="space-y-1.5">
      <p className="font-bold text-primary flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" aria-hidden="true" />
        مساحة إعلانية
      </p>
      <p className="text-sm text-muted-foreground">
        سيظهر إعلان البانر هنا في النسخة النهائية
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: QuizFilters (فلاتر الاختبار)
// ─────────────────────────────────────────────────────────────

interface QuizFiltersProps {
  categories: string[];
  selectedCategory: string;
  selectedDifficulty: Difficulty;
  onCategoryChange: (value: string) => void;
  onDifficultyChange: (value: Difficulty) => void;
  isLoading: boolean;
}

const QuizFilters = ({
  categories,
  selectedCategory,
  selectedDifficulty,
  onCategoryChange,
  onDifficultyChange,
  isLoading,
}: QuizFiltersProps) => (
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="flex-1 space-y-2">
      <label htmlFor="category-select" className="text-sm font-medium block">
        اختر الفئة
      </label>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger id="category-select" className="w-full">
          <SelectValue placeholder="اختر فئة" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(category => (
            <SelectItem key={category} value={category}>
              {formatCategory(category)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    
    <div className="flex-1 space-y-2">
      <label className="text-sm font-medium block">مستوى الصعوبة</label>
      <Tabs 
        defaultValue={selectedDifficulty} 
        onValueChange={(val) => onDifficultyChange(val as Difficulty)} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          {DIFFICULTY_LEVELS.map(level => (
            <TabsTrigger 
              key={level} 
              value={level}
              className="data-[state=active]:shadow-md transition-all"
            >
              {formatDifficulty(level)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 🎮 المكون الرئيسي: QuizzesPage
// ─────────────────────────────────────────────────────────────

type QuizState = 'not_started' | 'in_progress' | 'finished';

export default function QuizzesPage() {
  const { user, awardPoints } = useAuth();
  const { toast } = useToast();

  // State: البيانات
  const [filteredQuizzes, setFilteredQuizzes] = useState<Poll[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // State: الفلاتر
  const [selectedCategory, setSelectedCategory] = useState<string>('islamic');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');
  
  // State: حالة الاختبار
  const [quizState, setQuizState] = useState<QuizState>('not_started');

  // Refs
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // 📡 جلب الفئات المتاحة
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('content')
          .select('category')
          .eq('type', 'challenge');

        if (error) throw error;
        
        if (data && isMountedRef.current) {
          const uniqueCats = Array.from(new Set(data.map(p => p.category as string)));
          // ترتيب: الإسلامية أولاً، ثم الباقي أبجدياً
          const sortedCats = [
            'islamic', 
            ...uniqueCats.filter(c => c !== 'islamic').sort()
          ].filter(c => uniqueCats.includes(c));
          setAllCategories(sortedCats);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        if (isMountedRef.current) {
          toast({ 
            variant: "destructive", 
            title: "خطأ", 
            description: "فشل تحميل الفئات" 
          });
        }
      }
    };
    
    fetchCategories();
  }, [toast]);

  // 📡 جلب الأسئلة حسب الفلتر
  useEffect(() => {
    if (!selectedCategory || !selectedDifficulty) return;
    
    const fetchQuizzes = async () => {
      if (!isMountedRef.current) return;
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('content')
          .select('*')
          .eq('type', 'challenge')
          .eq('category', selectedCategory)
          .eq('difficulty', selectedDifficulty);

        if (error) throw error;
        
        if (isMountedRef.current) {
          const mappedData = (data || []).map(item => ({
            ...item,
            correctOptionId: item.correct_option_id,
          }));
          
          // خلط عشوائي وأخذ أول 10 أسئلة
          const shuffled = shuffleArray(mappedData);
          setFilteredQuizzes(shuffled.slice(0, QUIZ_CONFIG.MAX_QUESTIONS));
        }
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        if (isMountedRef.current) {
          toast({ 
            variant: "destructive", 
            title: "خطأ في جلب البيانات",
            description: "يرجى المحاولة لاحقاً"
          });
          setFilteredQuizzes([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchQuizzes();
  }, [selectedCategory, selectedDifficulty, toast]);

  // 🎯 إدارة الإعلانات في شاشة النتائج
  useTelegramAds(quizState === 'finished');

  // 🎮 منطق الاختبار
  const {
    currentQuestion,
    currentIndex,
    totalScore,
    progress,
    isFinished,
    handleAnswer,
    restart,
    totalQuestions,
  } = useQuizLogic({
    quizzes: filteredQuizzes,
    onCorrectAnswer: async () => {
      if (user) {
        await awardPoints(QUIZ_CONFIG.CORRECT_ANSWER_POINTS, 'quiz_correct', { 
          category: selectedCategory, 
          difficulty: selectedDifficulty 
        });
      }
    },
    onFinish: () => {
      setQuizState('finished');
    },
  });

  // 🔄 بدء الاختبار
  const startQuiz = useCallback(() => {
    if (filteredQuizzes.length === 0) {
      toast({
        variant: "destructive",
        title: "⚠️ لا توجد أسئلة",
        description: "يرجى اختيار فئة ومستوى صعوبة مختلفين.",
      });
      return;
    }
    setQuizState('in_progress');
    restart();
  }, [filteredQuizzes.length, restart, toast]);

  // 🔄 إعادة تعيين الاختبار
  const restartQuiz = useCallback(() => {
    setQuizState('not_started');
    restart();
  }, [restart]);

  // ⚠️ معالجة حالة عدم وجود سؤال
  useEffect(() => {
    if (quizState === 'in_progress' && !currentQuestion && totalQuestions > 0) {
      const timer = setTimeout(() => restartQuiz(), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentQuestion, quizState, totalQuestions, restartQuiz]);

  // 📊 حساب النقاط الكلي
  const totalPoints = useMemo(() => 
    (user?.points || 0) + (totalScore * QUIZ_CONFIG.CORRECT_ANSWER_POINTS)
  , [user?.points, totalScore]);

  // ─────────────────────────────────────────
  // 🎬 واجهة: شاشة البدء
  // ─────────────────────────────────────────
  if (quizState === 'not_started') {
    return (
      <main className="container mx-auto px-4 py-8 animate-in fade-in-50 duration-500">
        <header className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
            <BrainCircuit className="h-4 w-4" aria-hidden="true" />
            <span>تحدي المعرفة</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            الاختبارات المعرفية
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            اختبر معلوماتك، تعلّم أشياء جديدة، واجمع النقاط لتتصدر اللوحة!
          </p>
        </header>

        <Card className="max-w-2xl mx-auto shadow-xl border-border/60">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">🎯 اختر اختبارك</CardTitle>
            <CardDescription>
              حدد الفئة ومستوى الصعوبة لبدء التحدي
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <QuizFilters
              categories={allCategories}
              selectedCategory={selectedCategory}
              selectedDifficulty={selectedDifficulty}
              onCategoryChange={setSelectedCategory}
              onDifficultyChange={setSelectedDifficulty}
              isLoading={loading}
            />
            
            {loading ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
                <p className="text-muted-foreground">جاري تحضير الأسئلة...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="py-6 text-center space-y-3">
                <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
                <p className="text-muted-foreground">
                  لا توجد أسئلة بهذه المواصفات حالياً
                </p>
                <p className="text-sm text-muted-foreground/70">
                  جرب فئة أو مستوى صعوبة آخر
                </p>
              </div>
            ) : (
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <p className="font-medium flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  {filteredQuizzes.length} أسئلة جاهزة للبدء
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  الفئة: {formatCategory(selectedCategory)} • 
                  الصعوبة: {formatDifficulty(selectedDifficulty)}
                </p>
              </div>
            )}

            <Button 
              size="lg" 
              onClick={startQuiz} 
              className="w-full text-lg py-6 gap-2 shadow-lg hover:shadow-xl transition-all"
              disabled={loading || filteredQuizzes.length === 0}
            >
              <span>🚀 ابدأ الاختبار الآن</span>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─────────────────────────────────────────
  // 🏆 واجهة: شاشة النتائج
  // ─────────────────────────────────────────
  if (quizState === 'finished' || isFinished) {
    const percentage = Math.round((totalScore / totalQuestions) * 100);
    
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh] animate-in zoom-in-95 duration-500">
        <Card className="max-w-lg w-full text-center p-6 md:p-10 shadow-2xl border-border/60">
          <CardHeader className="space-y-4">
            <div className="relative mx-auto">
              <Trophy className={cn(
                "h-20 w-20 mx-auto mb-2 transition-all",
                percentage >= 70 ? "text-amber-500 drop-shadow-lg" : "text-primary"
              )} aria-hidden="true" />
              {percentage >= 80 && (
                <span className="absolute -top-1 -right-1 text-2xl animate-bounce" aria-hidden="true">🎉</span>
              )}
            </div>
            <CardTitle className="text-3xl md:text-4xl font-headline font-bold">
              {percentage >= 80 ? '🌟 ممتاز!' : percentage >= 60 ? '✅ جيد جداً!' : '💪 حاول مرة أخرى!'}
            </CardTitle>
            <CardDescription className="text-lg space-y-1">
              <p>
                أجبت بشكل صحيح على{' '}
                <span className="font-bold text-primary">{totalScore}</span>
                {' '}من{' '}
                <span className="font-bold">{totalQuestions}</span>
                {' '}أسئلة
              </p>
              <p className="text-muted-foreground">
                نسبة النجاح: {percentage}%
              </p>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-5">
            {/* بطاقة النقاط */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 rounded-xl space-y-3">
              <p className="text-lg font-semibold flex items-center justify-center gap-2">
                <span>💎 مجموع نقاطك</span>
              </p>
              <div className="text-4xl font-bold text-primary tracking-tight">
                {totalPoints}
              </div>
              {totalScore > 0 && (
                <p className="text-sm text-muted-foreground">
                  +{totalScore} نقطة من هذا الاختبار
                </p>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="space-y-3">
              <Button size="lg" onClick={restartQuiz} className="w-full gap-2">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>اختبار جديد</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  restart();
                  setQuizState('not_started');
                }} 
                className="w-full gap-2"
              >
                <span>تغيير الفئة</span>
              </Button>
            </div>
            
            <AdBanner />
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─────────────────────────────────────────
  // ⏳ واجهة: حالة التحميل
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" aria-hidden="true" />
          <p className="text-lg font-medium">جاري التحضير...</p>
          <p className="text-muted-foreground">نجهز لك أفضل الأسئلة</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // ❌ واجهة: حالة الخطأ
  // ─────────────────────────────────────────
  if (!currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" aria-hidden="true" />
        <p className="text-lg font-medium">حدث خطأ غير متوقع</p>
        <p className="text-muted-foreground">جاري العودة تلقائياً...</p>
        <Button variant="outline" onClick={restartQuiz}>
          العودة يدوياً
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // 🎮 واجهة: الاختبار الجاري
  // ─────────────────────────────────────────
  return (
    <main className="container mx-auto px-4 py-6 md:py-8 animate-in slide-in-from-bottom-4 duration-300">
      {/* شريط التقدم والعناصر العلوية */}
      <div className="max-w-4xl mx-auto mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-medium">
              {formatCategory(selectedCategory)}
            </Badge>
            <Badge variant="secondary" className="font-medium">
              {formatDifficulty(selectedDifficulty)}
            </Badge>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-1.5">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                <span>إنهاء</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>هل تريد إنهاء الاختبار؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم فقدان تقدمك الحالي والعودة إلى قائمة الاختيارات.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>متابعة</AlertDialogCancel>
                <AlertDialogAction onClick={restartQuiz} className="bg-destructive hover:bg-destructive/90">
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
            <span>{currentIndex + 1} / {totalQuestions}</span>
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
        questionNumber={currentIndex + 1}
        totalQuestions={totalQuestions}
      />
    </main>
  );
}
