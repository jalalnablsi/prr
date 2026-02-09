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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

// This component is self-contained for the quiz experience.
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
                <CardTitle className="text-2xl md:text-3xl font-headline font-bold">{item.question}</CardTitle>
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


export default function QuizzesPage() {
  const allQuizzes = useMemo(() => MOCK_DATA.filter(item => item.type === 'challenge' && item.difficulty), []);
  const categories = useMemo(() => ['islamic', ...Array.from(new Set(allQuizzes.map(p => p.category))).filter(c => c !== 'islamic')], [allQuizzes]);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Poll['difficulty']>('easy');
  
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'finished'>('not_started');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const { toast } = useToast();

  const filteredQuizzes = useMemo(() => {
      return allQuizzes.filter(quiz => quiz.category === selectedCategory && quiz.difficulty === selectedDifficulty);
  }, [allQuizzes, selectedCategory, selectedDifficulty]);

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

  const handleAnswer = (isCorrect: boolean) => {
      setAnswers(prev => [...prev, { questionId: filteredQuizzes[currentQuestionIndex].id, isCorrect }]);
      
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

  const totalScore = useMemo(() => answers.filter(a => a.isCorrect).length, [answers]);
  const totalQuestions = filteredQuizzes.length;

  const averageBeatPercentage = useMemo(() => {
      if (answers.length === 0) return 0;
      const correctAnswers = answers.filter(a => a.isCorrect);
      if (correctAnswers.length === 0) return 0;

      const answeredQuestionIds = correctAnswers.map(a => a.questionId);
      const answeredQuestions = filteredQuizzes.filter(q => answeredQuestionIds.includes(q.id));
      
      const totalBeatPercentage = answeredQuestions.reduce((acc, q) => acc + (q.beatPercentage || 0), 0);
      return Math.round(totalBeatPercentage / answeredQuestions.length);
  }, [answers, filteredQuizzes]);

  if (quizState === 'not_started') {
      return (
          <div className="container mx-auto px-4 py-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-headline font-bold mb-2">الاختبارات المعرفية</h1>
                <p className="text-muted-foreground text-lg">تحدى معلوماتك في مختلف المجالات والمستويات.</p>
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
                      <p className="text-center text-muted-foreground pt-4">
                          {filteredQuizzes.length > 0 ? `تم العثور على ${filteredQuizzes.length} سؤال في هذا المستوى.` : 'لا توجد أسئلة بهذه المواصفات حالياً.'}
                      </p>
                      <Button size="lg" onClick={startQuiz} className="w-full" disabled={filteredQuizzes.length === 0}>
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
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                          <p className="text-lg font-semibold">أداء رائع!</p>
                          <p className="text-muted-foreground">لقد تفوقت على {averageBeatPercentage}% من المشاركين في الأسئلة التي أجبت عليها بشكل صحيح.</p>
                      </div>
                      <Button size="lg" onClick={restartQuiz}>
                         <RefreshCw className="ms-2 h-4 w-4" />
                          إعادة الاختبار
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  const currentQuestion = filteredQuizzes[currentQuestionIndex];
  if (!currentQuestion) {
    // Should not happen if startQuiz is disabled correctly
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <p>حدث خطأ ما. جارٍ العودة إلى صفحة الاختيار...</p>
            {setTimeout(() => restartQuiz(), 2000)}
        </div>
    );
  }

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
