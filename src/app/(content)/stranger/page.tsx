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
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// 🎲 ثوابت وإعدادات اللعبة
// ─────────────────────────────────────────────────────────────
const GAME_CONFIG = {
  MIN_PLAYERS: 3,
  MAX_PLAYERS: 10,
  DEFAULT_PLAYERS: 4,
  ROLE_VIEW_DURATION: 30, // seconds before auto-hide reminder
  TRANSITION_DELAY: 400, // ms for animations
} as const;

// تصفية مواضيع اللعبة مرة واحدة عند التحميل
const GAME_TOPICS_POOL = PlaceHolderImages
  .filter(img => img.imageHint === 'stranger_game')
  .map(img => ({
    id: img.imageUrl, // استخدام الرابط كمعرّف فريد
    imageUrl: img.imageUrl,
    description: img.description,
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
    // بذرة عشوائية فريدة لكل جلسة
    this.sessionSeed = Date.now() + Math.random();
  }

  /**
   * إعادة تعيين مدير المواضيع لجلسة جديدة
   */
  reset() {
    this.availableTopics = [...GAME_TOPICS_POOL];
    this.usedTopics = new Set();
    this.shufflePool();
  }

  /**
   * خلط المواضيع باستخدام بذرة الجلسة لضمان عشوائية حقيقية
   */
  private shufflePool() {
    // خوارزمية Fisher-Yates مع بذرة مخصصة
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

  /**
   * جلب موضوع جديد غير مكرر
   * @returns موضوع عشوائي أو null إذا نفدت المواضيع
   */
  getNextTopic(): typeof GAME_TOPICS_POOL[0] | null {
    if (this.availableTopics.length === 0) {
      // إذا نفدت المواضيع، نعيد تدوير المستخدمة مع خلط جديد
      this.usedTopics.clear();
      this.availableTopics = [...GAME_TOPICS_POOL];
      this.shufflePool();
      console.log('🔄 تم إعادة تدوير مجموعة المواضيع');
    }

    const topic = this.availableTopics.pop();
    if (topic) {
      this.usedTopics.add(topic.id);
    }
    return topic || null;
  }

  /**
   * إحصائيات الجلسة
   */
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

interface UseStrangerGameReturn {
  // الحالة
  gameState: GameState;
  numPlayers: number;
  currentPlayer: number;
  isRoleVisible: boolean;
  topic: { imageUrl: string; description: string } | null;
  stranger: number | null;
  
  // الإجراءات
  setNumPlayers: (value: number) => void;
  startGame: () => void;
  revealRole: () => void;
  nextPlayer: () => void;
  startDiscussion: () => void;
  endGame: () => void;
  resetGame: () => void;
  
  // معلومات مساعدة
  isCurrentPlayerStranger: boolean;
  gameStats: { total: number; used: number; remaining: number };
}

const useStrangerGame = (): UseStrangerGameReturn => {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [numPlayers, setNumPlayers] = useState(GAME_CONFIG.DEFAULT_PLAYERS);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [isRoleVisible, setIsRoleVisible] = useState(false);
  
  // بيانات حساسة - تُمسح فوراً بعد الاستخدام
  const [topic, setTopic] = useState<UseStrangerGameReturn['topic']>(null);
  const [stranger, setStranger] = useState<number | null>(null);
  
  // مدير المواضيع (يُحفظ في ref لمنع إعادة الإنشاء)
  const topicManagerRef = useRef<TopicManager>(new TopicManager());

  // توليد رقم عشوائي آمن للغريب
  const generateSecureRandom = useCallback((max: number): number => {
    if (typeof window !== 'undefined' && window.crypto) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return (array[0] % max) + 1;
    }
    return Math.floor(Math.random() * max) + 1;
  }, []);

  // بدء لعبة جديدة
  const startGame = useCallback(() => {
    // إعادة تعيين مدير المواضيع إذا بدأنا جلسة جديدة تماماً
    if (gameState === 'setup') {
      topicManagerRef.current.reset();
    }
    
    // اختيار الغريب عشوائياً
    const newStranger = generateSecureRandom(numPlayers);
    setStranger(newStranger);
    
    // جلب موضوع غير مكرر
    const newTopic = topicManagerRef.current.getNextTopic();
    setTopic(newTopic);
    
    // الانتقال لمرحلة كشف الأدوار
    setGameState('reveal');
    setCurrentPlayer(1);
    setIsRoleVisible(false);
  }, [numPlayers, gameState, generateSecureRandom]);

  // كشف الدور للاعب الحالي
  const revealRole = useCallback(() => {
    setIsRoleVisible(true);
    
    // اهتزاز خفيف للجوال كإشعار
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  // الانتقال للاعب التالي
  const nextPlayer = useCallback(() => {
    // إخفاء الدور فوراً لمنع الغش
    setIsRoleVisible(false);
    
    if (currentPlayer < numPlayers) {
      // الانتقال للاعب التالي بعد تأخير بسيط للحركة
      setTimeout(() => {
        setCurrentPlayer(prev => prev + 1);
      }, GAME_CONFIG.TRANSITION_DELAY);
    } else {
      // انتهاء مرحلة الأدوار - مسح البيانات الحساسة
      setStranger(null);
      setTopic(null);
      setGameState('discuss');
    }
  }, [currentPlayer, numPlayers]);

  // بدء مرحلة النقاش
  const startDiscussion = useCallback(() => {
    setGameState('discuss');
  }, []);

  // إنهاء اللعبة وعرض النتائج
  const endGame = useCallback(() => {
    // استعادة البيانات للعرض النهائي فقط
    // (في تطبيق حقيقي نستخدم تشفيراً، هنا للعب المحلي يكفي)
    setGameState('end');
  }, []);

  // إعادة تعيين اللعبة بالكامل
  const resetGame = useCallback(() => {
    setGameState('setup');
    setNumPlayers(GAME_CONFIG.DEFAULT_PLAYERS);
    setCurrentPlayer(1);
    setStranger(null);
    setTopic(null);
    setIsRoleVisible(false);
    topicManagerRef.current.reset();
  }, []);

  // هل اللاعب الحالي هو الغريب؟
  const isCurrentPlayerStranger = useMemo(() => 
    currentPlayer === stranger && stranger !== null
  , [currentPlayer, stranger]);

  // إحصائيات المواضيع المستخدمة
  const gameStats = useMemo(() => 
    topicManagerRef.current.getStats()
  , [gameState]); // تحديث الإحصائيات عند تغيير الحالة

  return {
    gameState,
    numPlayers,
    currentPlayer,
    isRoleVisible,
    topic,
    stranger,
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
// 🧩 مكون: AdBanner (إعلان محاكى)
// ─────────────────────────────────────────────────────────────

const AdBanner = ({ className }: { className?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      "w-full max-w-lg mx-auto p-4 rounded-xl",
      "bg-gradient-to-br from-muted/60 to-muted/30",
      "border-2 border-dashed border-border/60 text-center",
      "hover:border-primary/40 transition-colors",
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
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: RoleCard (بطاقة عرض الدور)
// ─────────────────────────────────────────────────────────────

interface RoleCardProps {
  isStranger: boolean;
  topic: { imageUrl: string; description: string } | null;
  onContinue: () => void;
}

const RoleCard = ({ isStranger, topic, onContinue }: RoleCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={cn(
      "p-6 rounded-2xl border-2 space-y-5",
      "bg-card/90 backdrop-blur-sm",
      isStranger 
        ? "border-destructive/40 bg-destructive/5 shadow-lg shadow-destructive/10" 
        : "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
    )}
  >
    {/* رأس البطاقة */}
    <div className="text-center space-y-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn(
          "w-16 h-16 rounded-full mx-auto flex items-center justify-center",
          isStranger ? "bg-destructive/20" : "bg-primary/20"
        )}
      >
        {isStranger ? (
          <EyeOff className="h-8 w-8 text-destructive" aria-hidden="true" />
        ) : (
          <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
        )}
      </motion.div>
      
      <h3 className={cn(
        "text-2xl font-bold font-headline",
        isStranger ? "text-destructive" : "text-primary"
      )}>
        {isStranger ? '🎭 أنت الغريب!' : '✅ أنت من الفريق'}
      </h3>
    </div>

    {/* محتوى الدور */}
    <div className="space-y-4 text-center">
      {isStranger ? (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground leading-relaxed"
        >
          مهمتك هي <span className="font-bold text-foreground">التظاهر</span> بمعرفة الموضوع السري.
          <br />
          استمع جيداً لأسئلة اللاعبين الآخرين وتحدث بشكل غامض.
          <br />
          <span className="text-destructive font-medium">لا تدعهم يكشفون هويتك!</span>
        </motion.p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <p className="text-muted-foreground">الكلمة السرية هي:</p>
          <motion.p 
            className="text-3xl font-bold font-headline text-foreground"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {topic?.description}
          </motion.p>
          
          {topic?.imageUrl && (
            <motion.div 
              className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-primary/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.div>
          )}
        </motion.div>
      )}
    </div>

    {/* زر المتابعة */}
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
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
    </motion.div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: PlayerTurnScreen (شاشة دور اللاعب)
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
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <Fingerprint className="h-14 w-14 text-primary mx-auto mb-3" aria-hidden="true" />
        </motion.div>
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
        <AnimatePresence mode="wait">
          {isRoleVisible ? (
            <RoleCard 
              key="role-revealed"
              isStranger={isStranger}
              topic={topic}
              onContinue={onNext}
            />
          ) : (
            <motion.div
              key="role-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8 space-y-4"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      
      {/* شريط تقدم صغير */}
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

  // منع التنقل للخلف أثناء مرحلة كشف الأدوار (لمنع الغش)
  useEffect(() => {
    if (gameState !== 'reveal') return;
    
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      // إضافة حالة جديدة لمنع الرجوع
      window.history.pushState(null, '', location.href);
    };
    
    // إضافة حالة لمنع الرجوع
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
      // يمكن إضافة toast هنا للتذكير
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]); // نمط اهتزاز تذكيري
      }
    }, GAME_CONFIG.ROLE_VIEW_DURATION * 1000);
    
    return () => clearTimeout(timer);
  }, [isRoleVisible, gameState]);

  // ─────────────────────────────────────────
  // 🎬 شاشة: الإعدادات
  // ─────────────────────────────────────────
  if (gameState === 'setup') {
    return (
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]"
      >
        <Card className="max-w-md w-full shadow-xl border-border/60">
          <CardHeader className="text-center space-y-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Fingerprint className="h-16 w-16 text-primary mx-auto" aria-hidden="true" />
            </motion.div>
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
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
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
            </motion.div>

            {/* إحصائيات المواضيع */}
            <motion.div 
              className="bg-muted/40 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="font-medium flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" aria-hidden="true" />
                {gameStats.remaining} موضوع متبقي في الجلسة
              </p>
              <p className="text-sm text-muted-foreground text-center">
                تم استخدام {gameStats.used} من أصل {gameStats.total} موضوع
              </p>
            </motion.div>

            {/* زر البدء */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                size="lg" 
                className="w-full text-lg py-6 gap-2 shadow-lg hover:shadow-xl transition-all"
                onClick={startGame}
              >
                <span>🚀 ابدأ اللعبة</span>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.main>
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
      <motion.main
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] gap-6"
      >
        <Card className="max-w-md w-full shadow-xl border-border/60 text-center">
          <CardHeader>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            >
              <Users className="h-16 w-16 text-primary mx-auto mb-4" aria-hidden="true" />
            </motion.div>
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
            <motion.div 
              className="bg-muted/40 rounded-lg p-4 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="font-medium">💡 أفكار للأسئلة:</p>
              <ul className="text-sm text-muted-foreground space-y-1 text-right">
                <li>• ما هو أول شيء يتبادر لذهنك عند سماع الكلمة؟</li>
                <li>• أين يمكن أن نجد هذا الشيء عادةً؟</li>
                <li>• ما هو لون هذا الشيء في رأيك؟</li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={endGame}
              >
                <span>🔍 كشف الغريب</span>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
        
        <AdBanner />
      </motion.main>
    );
  }

  // ─────────────────────────────────────────
  // 🏁 شاشة: النتائج
  // ─────────────────────────────────────────
  if (gameState === 'end') {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] gap-6"
      >
        <Card className="max-w-md w-full shadow-xl border-border/60 text-center">
          <CardHeader>
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            >
              <Trophy className="h-16 w-16 text-amber-500 mx-auto mb-4" aria-hidden="true" />
            </motion.div>
            <CardTitle className="text-3xl font-headline font-bold">
              🎉 انتهت اللعبة!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* نتيجة الغريب */}
            <motion.div 
              className="p-6 rounded-2xl border-2 border-dashed space-y-4 bg-card/80"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-muted-foreground font-medium">الغريب كان:</p>
              <motion.p 
                className="text-4xl font-bold text-primary font-headline"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                اللاعب رقم {stranger} 🎭
              </motion.p>
              
              <div className="pt-4 border-t border-border/60 space-y-3">
                <p className="text-muted-foreground font-medium">الموضوع السري كان:</p>
                <motion.p 
                  className="text-2xl font-bold font-headline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {topic?.description}
                </motion.p>
                
                {topic?.imageUrl && (
                  <motion.div 
                    className="relative w-full aspect-video rounded-xl overflow-hidden border-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Image 
                      src={topic.imageUrl} 
                      alt={topic.description} 
                      fill 
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/placeholder-topic.png';
                      }}
                    />
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* أزرار الإجراءات */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button size="lg" className="w-full gap-2" onClick={resetGame}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                <span>لعب جولة جديدة</span>
              </Button>
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => {
                  // إعادة تعيين مع الاحتفاظ بإعدادات اللاعبين
                  startGame();
                }}
              >
                <span>نفس الإعدادات، موضوع جديد</span>
              </Button>
            </motion.div>
          </CardContent>
        </Card>
        
        <AdBanner />
      </motion.main>
    );
  }

  return null;
}

// مكون Trophy محلي لتجنب مشكلة الاستيراد
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
