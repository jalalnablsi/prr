"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Eye, EyeOff, Users, RefreshCw, Fingerprint, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// ─────────────────────────────────────────────────────────────
// 🎲 ثوابت وإعدادات اللعبة
// ─────────────────────────────────────────────────────────────
const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 10,
  DEFAULT_PLAYERS: 4,
  ROLE_VIEW_DURATION: 30,
  TRANSITION_DELAY: 300,
} as const;

// تصفية وتنظيف مواضيع اللعبة
const GAME_TOPICS_POOL = PlaceHolderImages
  .filter(img => img.imageHint === 'stranger_game')
  .map(img => ({
    id: img.imageUrl,
    imageUrl: img.imageUrl.trim(),
    description: img.description.trim(),
  }));

// ─────────────────────────────────────────────────────────────
// 🎲 نظام إدارة المواضيع (يمنع التكرار في الجلسة)
// ─────────────────────────────────────────────────────────────

class TopicManager {
  private availableTopics: typeof GAME_TOPICS_POOL;
  private usedTopics: Set<string>;
  private sessionSeed: number;

  constructor() {
    this.reset();
    this.sessionSeed = Date.now() + Math.random();
  }

  reset() {
    this.availableTopics = [...GAME_TOPICS_POOL];
    this.usedTopics = new Set();
    this.shufflePool();
  }

  private shufflePool() {
    const seededRandom = () => {
      this.sessionSeed = (this.sessionSeed * 9301 + 49297) % 233280;
      return this.sessionSeed / 233280;
    };

    for (let i = this.availableTopics.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [this.availableTopics[i], this.availableTopics[j]] = 
      [this.availableTopics[j], this.availableTopics[i]];
    }
  }

  getNextTopic(): typeof GAME_TOPICS_POOL[0] | null {
    if (this.availableTopics.length === 0) {
      this.usedTopics.clear();
      this.availableTopics = [...GAME_TOPICS_POOL];
      this.shufflePool();
    }

    const topic = this.availableTopics.pop();
    if (topic) {
      this.usedTopics.add(topic.id);
    }
    return topic || null;
  }

  getStats() {
    return {
      total: GAME_TOPICS_POOL.length,
      used: this.usedTopics.size,
      remaining: this.availableTopics.length,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 🪝 Custom Hook: useStrangerGame
// ─────────────────────────────────────────────────────────────

type GameState = 'setup' | 'reveal' | 'discuss' | 'end';

interface FinalResults {
  stranger: number | null;
  topic: { imageUrl: string; description: string } | null;
}

interface UseStrangerGameReturn {
  gameState: GameState;
  numPlayers: number;
  currentPlayer: number;
  isRoleVisible: boolean;
  topic: { imageUrl: string; description: string } | null;
  stranger: number | null;
  finalResults: FinalResults;
  setNumPlayers: (value: number) => void;
  startGame: () => void;
  revealRole: () => void;
  nextPlayer: () => void;
  startDiscussion: () => void;
  endGame: () => void;
  resetGame: () => void;
  isCurrentPlayerStranger: boolean;
  gameStats: { total: number; used: number; remaining: number };
}

const useStrangerGame = (): UseStrangerGameReturn => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [numPlayers, setNumPlayers] = useState(GAME_CONFIG.DEFAULT_PLAYERS);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [isRoleVisible, setIsRoleVisible] = useState(false);
  const [topic, setTopic] = useState<UseStrangerGameReturn['topic']>(null);
  const [stranger, setStranger] = useState<number | null>(null);
  
  // ✅ حالة جديدة: لحفظ النتائج النهائية للعرض فقط
  const [finalResults, setFinalResults] = useState<FinalResults>({ 
    stranger: null, 
    topic: null 
  });
  
  const topicManagerRef = useRef<TopicManager>(new TopicManager());

  const generateSecureRandom = useCallback((max: number): number => {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return (array[0] % max) + 1;
    }
    return Math.floor(Math.random() * max) + 1;
  }, []);

  const startGame = useCallback(() => {
    if (gameState === 'setup') {
      topicManagerRef.current.reset();
    }
    
    const newStranger = generateSecureRandom(numPlayers);
    setStranger(newStranger);
    
    const newTopic = topicManagerRef.current.getNextTopic();
    setTopic(newTopic);
    
    setGameState('reveal');
    setCurrentPlayer(1);
    setIsRoleVisible(false);
  }, [numPlayers, gameState, generateSecureRandom]);

  const revealRole = useCallback(() => {
    setIsRoleVisible(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const nextPlayer = useCallback(() => {
    setIsRoleVisible(false);
    
    if (currentPlayer < numPlayers) {
      setTimeout(() => {
        setCurrentPlayer(prev => prev + 1);
      }, GAME_CONFIG.TRANSITION_DELAY);
    } else {
      // ✅ حفظ النتائج النهائية قبل مسح البيانات الحساسة
      setFinalResults({ stranger, topic });
      
      // مسح البيانات الحساسة لمنع الغش أثناء مرحلة النقاش
      setStranger(null);
      setTopic(null);
      setGameState('discuss');
    }
  }, [currentPlayer, numPlayers, stranger, topic]);

  const startDiscussion = useCallback(() => {
    setGameState('discuss');
  }, []);

  const endGame = useCallback(() => {
    setGameState('end');
  }, []);

  const resetGame = useCallback(() => {
    setGameState('setup');
    setNumPlayers(GAME_CONFIG.DEFAULT_PLAYERS);
    setCurrentPlayer(1);
    setStranger(null);
    setTopic(null);
    setFinalResults({ stranger: null, topic: null }); // ✅ مسح النتائج القديمة
    setIsRoleVisible(false);
    topicManagerRef.current.reset();
  }, []);

  const isCurrentPlayerStranger = useMemo(() => 
    currentPlayer === stranger && stranger !== null
  , [currentPlayer, stranger]);

  const gameStats = useMemo(() => 
    topicManagerRef.current.getStats()
  , [gameState]);

  return {
    gameState,
    numPlayers,
    currentPlayer,
    isRoleVisible,
    topic,
    stranger,
    finalResults, // ✅ إضافة النتائج النهائية للإرجاع
    setNumPlayers,
    startGame,
    revealRole,
    nextPlayer,
    startDiscussion,
    endGame,
    resetGame,
    isCurrentPlayerStranger,
    gameStats,
  };
};

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: AdBanner
// ─────────────────────────────────────────────────────────────

const AdBanner = ({ className }: { className?: string }) => (
  <div 
    className={cn(
      "w-full max-w-lg mx-auto p-4 rounded-xl",
      "bg-gradient-to-br from-muted/60 to-muted/30",
      "border-2 border-dashed border-border/60 text-center",
      "animate-in fade-in-50 duration-500",
      className
    )}
  >
    <div className="space-y-1.5">
      <p className="font-bold text-primary flex items-center justify-center gap-2">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        مساحة إعلانية
      </p>
      <p className="text-sm text-muted-foreground">
        سيظهر إعلان البانر هنا في النسخة النهائية
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: RoleCard (بدون framer-motion)
// ─────────────────────────────────────────────────────────────

interface RoleCardProps {
  isStranger: boolean;
  topic: { imageUrl: string; description: string } | null;
  onContinue: () => void;
}

const RoleCard = ({ isStranger, topic, onContinue }: RoleCardProps) => (
  <div className={cn(
    "p-6 rounded-2xl border-2 space-y-5",
    "bg-card/90 backdrop-blur-sm",
    "animate-in fade-in-50 zoom-in-95 duration-300",
    isStranger 
      ? "border-destructive/40 bg-destructive/5 shadow-lg shadow-destructive/10" 
      : "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
  )}>
    {/* رأس البطاقة */}
    <div className="text-center space-y-2">
      <div className={cn(
        "w-16 h-16 rounded-full mx-auto flex items-center justify-center",
        "animate-in zoom-in-50 duration-300 delay-100",
        isStranger ? "bg-destructive/20" : "bg-primary/20"
      )}>
        {isStranger ? (
          <EyeOff className="h-8 w-8 text-destructive" aria-hidden="true" />
        ) : (
          <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
        )}
      </div>
      
      <h3 className={cn(
        "text-2xl font-bold font-headline",
        "animate-in fade-in-50 duration-300 delay-150",
        isStranger ? "text-destructive" : "text-primary"
      )}>
        {isStranger ? '🎭 أنت الغريب!' : '✅ أنت من الفريق'}
      </h3>
    </div>

    {/* محتوى الدور */}
    <div className="space-y-4 text-center">
      {isStranger ? (
        <p className="text-muted-foreground leading-relaxed animate-in fade-in-50 duration-300 delay-200">
          مهمتك هي <span className="font-bold text-foreground">التظاهر</span> بمعرفة الموضوع السري.
          <br />
          استمع جيداً لأسئلة اللاعبين الآخرين وتحدث بشكل غامض.
          <br />
          <span className="text-destructive font-medium">لا تدعهم يكشفون هويتك!</span>
        </p>
      ) : (
        <div className="space-y-4">
          <p className="text-muted-foreground animate-in fade-in-50 duration-300 delay-200">الكلمة السرية هي:</p>
          <p className="text-3xl font-bold font-headline text-foreground animate-in fade-in-50 zoom-in-95 duration-300 delay-250">
            {topic?.description}
          </p>
          
          {topic?.imageUrl && (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-primary/20 animate-in fade-in-50 duration-300 delay-300">
              <Image 
                src={topic.imageUrl} 
                alt={topic.description} 
                fill 
                className="object-cover"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/placeholder-topic.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          )}
        </div>
      )}
    </div>

    {/* زر المتابعة */}
    <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-400">
      <Button 
        size="lg" 
        className="w-full gap-2"
        onClick={onContinue}
      >
        <span>{isStranger ? '🤫 فهمت، سأتصرف بحذر' : '✅ حفظت الكلمة، التالي!'}</span>
      </Button>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        💡 تلميح: مرر الجهاز بسرعة للاعب التالي
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: PlayerTurnScreen
// ─────────────────────────────────────────────────────────────

interface PlayerTurnScreenProps {
  currentPlayer: number;
  numPlayers: number;
  isRoleVisible: boolean;
  onReveal: () => void;
  onNext: () => void;
  isStranger: boolean;
  topic: { imageUrl: string; description: string } | null;
}

const PlayerTurnScreen = ({
  currentPlayer,
  numPlayers,
  isRoleVisible,
  onReveal,
  onNext,
  isStranger,
  topic,
}: PlayerTurnScreenProps) => (
  <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] gap-6">
    <Card className="max-w-md w-full shadow-xl border-border/60">
      <CardHeader className="text-center pb-2">
        <div className="animate-in fade-in-50 duration-500">
          <Fingerprint className="h-14 w-14 text-primary mx-auto mb-3" aria-hidden="true" />
        </div>
        <CardTitle className="text-2xl md:text-3xl font-headline">
          دور اللاعب <span className="text-primary">#{currentPlayer}</span>
        </CardTitle>
        <CardDescription className="text-base">
          {isRoleVisible 
            ? 'احفظ معلوماتك جيداً قبل تمرير الجهاز' 
            : `مرر الهاتف للاعب ${currentPlayer} واطلب منه الضغط على الزر`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        {isRoleVisible ? (
          <div className="animate-in fade-in-50 duration-300">
            <RoleCard 
              isStranger={isStranger}
              topic={topic}
              onContinue={onNext}
            />
          </div>
        ) : (
          <div className="text-center py-8 space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
            <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Eye className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-muted-foreground">
              اضغط للكشف عن دورك السري
            </p>
            <Button 
              size="lg" 
              className="min-w-[200px] gap-2"
              onClick={onReveal}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>كشف دوري</span>
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="justify-center pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="gap-1">
            {currentPlayer} / {numPlayers}
          </Badge>
          <span>لاعبون عرفوا أدوارهم</span>
        </div>
      </CardFooter>
    </Card>
    
    <AdBanner />
  </div>
);

// ─────────────────────────────────────────────────────────────
// 🎮 المكون الرئيسي: StrangerGamePage
// ─────────────────────────────────────────────────────────────

export default function StrangerGamePage() {
  const {
    gameState,
    numPlayers,
    currentPlayer,
    isRoleVisible,
    topic,
    stranger,
    finalResults, // ✅ استخراج النتائج النهائية
    setNumPlayers,
    startGame,
    revealRole,
    nextPlayer,
    startDiscussion,
    endGame,
    resetGame,
    isCurrentPlayerStranger,
    gameStats,
  } = useStrangerGame();

  // منع التنقل للخلف أثناء مرحلة كشف الأدوار
  useEffect(() => {
    if (gameState !== 'reveal') return;
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', location.href);
    };
    
    window.history.pushState(null, '', location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameState]);

  // تذكير تلقائي بعد فترة من كشف الدور
  useEffect(() => {
    if (!isRoleVisible || gameState !== 'reveal') return;
    
    const timer = setTimeout(() => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }, GAME_CONFIG.ROLE_VIEW_DURATION * 1000);
    
    return () => clearTimeout(timer);
  }, [isRoleVisible, gameState]);

  // ─────────────────────────────────────────
  // 🎬 شاشة: الإعدادات
  // ─────────────────────────────────────────
  if (gameState === 'setup') {
    return (
      <main className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh] animate-in fade-in-50 duration-500">
        <Card className="max-w-md w-full shadow-xl border-border/60">
          <CardHeader className="text-center space-y-3">
            <div className="animate-pulse">
              <Fingerprint className="h-16 w-16 text-primary mx-auto" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">
              🎭 هناك غريب بيننا
            </CardTitle>
            <CardDescription className="text-lg">
              لعبة استنتاج اجتماعية لاكتشاف اللاعب الغريب. 
              <br />
              اجمع أصدقاءك وابدأ التحدي!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8 pt-6">
            {/* اختيار عدد اللاعبين */}
            <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-100">
              <Label htmlFor="players" className="flex items-center justify-center gap-2 text-lg font-medium">
                <Users className="h-5 w-5" aria-hidden="true" />
                <span>عدد اللاعبين:</span>
                <Badge variant="default" className="text-lg px-3">
                  {numPlayers}
                </Badge>
              </Label>
              <Slider
                id="players"
                min={GAME_CONFIG.MIN_PLAYERS}
                max={GAME_CONFIG.MAX_PLAYERS}
                step={1}
                value={[numPlayers]}
                onValueChange={(value) => setNumPlayers(value[0])}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>{GAME_CONFIG.MIN_PLAYERS} لاعبين</span>
                <span>{GAME_CONFIG.MAX_PLAYERS} لاعبين</span>
              </div>
            </div>

            {/* إحصائيات المواضيع */}
            <div className="bg-muted/40 rounded-lg p-4 space-y-2 animate-in fade-in-50 duration-300 delay-200">
              <p className="font-medium flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
                {gameStats.remaining} موضوع متبقي في الجلسة
              </p>
              <p className="text-sm text-muted-foreground text-center">
                تم استخدام {gameStats.used} من أصل {gameStats.total} موضوع
              </p>
            </div>

            {/* زر البدء */}
            <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-300">
              <Button 
                size="lg" 
                className="w-full text-lg py-6 gap-2 shadow-lg hover:shadow-xl transition-all"
                onClick={startGame}
              >
                <span>🚀 ابدأ اللعبة</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─────────────────────────────────────────
  // 👁️ شاشة: كشف الأدوار
  // ─────────────────────────────────────────
  if (gameState === 'reveal') {
    return (
      <PlayerTurnScreen
        currentPlayer={currentPlayer}
        numPlayers={numPlayers}
        isRoleVisible={isRoleVisible}
        onReveal={revealRole}
        onNext={nextPlayer}
        isStranger={isCurrentPlayerStranger}
        topic={topic}
      />
    );
  }

  // ─────────────────────────────────────────
  // 💬 شاشة: النقاش
  // ─────────────────────────────────────────
  if (gameState === 'discuss') {
    return (
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-in fade-in-50 zoom-in-95 duration-300">
        <Card className="max-w-md w-full shadow-xl border-border/60 text-center">
          <CardHeader>
            <div className="animate-in zoom-in-50 duration-300 delay-200">
              <Users className="h-16 w-16 text-primary mx-auto mb-4" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">
              💬 ابدأوا النقاش!
            </CardTitle>
            <CardDescription className="text-lg pt-2">
              الآن بعد أن عرف كل شخص دوره، ابدأوا في طرح أسئلة ذكية 
              <br />
              على بعضكم البعض لكشف الغريب!
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="bg-muted/40 rounded-lg p-4 space-y-2 animate-in fade-in-50 duration-300 delay-300">
              <p className="font-medium">💡 أفكار للأسئلة:</p>
              <ul className="text-sm text-muted-foreground space-y-1 text-right">
                <li>• ما هو أول شيء يتبادر لذهنك عند سماع الكلمة؟</li>
                <li>• أين يمكن أن نجد هذا الشيء عادةً؟</li>
                <li>• ما هو لون هذا الشيء في رأيك؟</li>
              </ul>
            </div>
            
            <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-400">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={endGame}
              >
                <span>🔍 كشف الغريب</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <AdBanner />
      </main>
    );
  }

  // ─────────────────────────────────────────
  // 🏁 شاشة: النتائج (✅ المعدلة لعرض finalResults)
  // ─────────────────────────────────────────
  if (gameState === 'end') {
    return (
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-in fade-in-50 duration-500">
        <Card className="max-w-md w-full shadow-xl border-border/60 text-center">
          <CardHeader>
            <div className="animate-in zoom-in-50 duration-500 delay-200">
              <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">
              🎉 انتهت اللعبة!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* نتيجة الغريب - ✅ تستخدم finalResults */}
            <div className="p-6 rounded-2xl border-2 border-dashed space-y-4 bg-card/80 animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-300">
              <p className="text-muted-foreground font-medium">الغريب كان:</p>
              <p className="text-4xl font-bold text-primary font-headline animate-in zoom-in-50 duration-300 delay-400">
                {/* ✅ العرض من finalResults بدلاً من stranger */}
                اللاعب رقم {finalResults.stranger} 🎭
              </p>
              
              <div className="pt-4 border-t border-border/60 space-y-3">
                <p className="text-muted-foreground font-medium">الموضوع السري كان:</p>
                <p className="text-2xl font-bold font-headline animate-in fade-in-50 duration-300 delay-500">
                  {/* ✅ العرض من finalResults بدلاً من topic */}
                  {finalResults.topic?.description}
                </p>
                
                {finalResults.topic?.imageUrl && (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 animate-in fade-in-50 duration-300 delay-600">
                    <Image 
                      src={finalResults.topic.imageUrl} 
                      alt={finalResults.topic.description} 
                      fill 
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-topic.png';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-4 duration-300 delay-700">
              <Button size="lg" className="w-full gap-2" onClick={resetGame}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>لعب جولة جديدة</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  startGame();
                }}
              >
                <span>نفس الإعدادات، موضوع جديد</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        <AdBanner />
      </main>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 🏆 مكون Trophy محلي (لتجنب مشكلة الاستيراد)
// ─────────────────────────────────────────────────────────────
const Trophy = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
