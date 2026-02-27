"use client";

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, Trophy, Medal, Loader2, Sparkles, Flame, Star, 
  TrendingUp, Users, Zap, Award, ChevronDown, ChevronUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

// ─────────────────────────────────────────────────────────────
// 🎨 الثوابت والألوان
// ─────────────────────────────────────────────────────────────
const RANK_STYLES = {
  1: {
    border: "border-yellow-400/60",
    bg: "bg-gradient-to-br from-yellow-400/20 via-amber-500/10 to-transparent",
    text: "text-yellow-400",
    glow: "shadow-[0_0_30px_rgba(250,204,21,0.4)]",
    badge: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
    icon: <Crown className="h-6 w-6 text-yellow-400 drop-shadow-lg" />,
    label: "👑 البطل",
  },
  2: {
    border: "border-slate-300/60",
    bg: "bg-gradient-to-br from-slate-300/20 via-gray-400/10 to-transparent",
    text: "text-slate-300",
    glow: "shadow-[0_0_20px_rgba(203,213,225,0.3)]",
    badge: "bg-gradient-to-r from-slate-300 to-gray-400 text-black",
    icon: <Medal className="h-5 w-5 text-slate-300" />,
    label: "🥈 الوصيف",
  },
  3: {
    border: "border-amber-600/60",
    bg: "bg-gradient-to-br from-amber-600/20 via-orange-700/10 to-transparent",
    text: "text-amber-500",
    glow: "shadow-[0_0_15px_rgba(217,119,6,0.3)]",
    badge: "bg-gradient-to-r from-amber-600 to-orange-700 text-white",
    icon: <Award className="h-5 w-5 text-amber-500" />,
    label: "🥉 المركز الثالث",
  },
} as const;

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: PodiumCard (للمراكز الثلاثة الأولى - تصميم منصة التتويج)
// ─────────────────────────────────────────────────────────────

interface PodiumCardProps {
  user: LeaderboardUser;
  rank: 1 | 2 | 3;
  isCurrentUser: boolean;
}

function PodiumCard({ user, rank, isCurrentUser }: PodiumCardProps) {
  const style = RANK_STYLES[rank];
  
  // ارتفاع المنصة حسب المركز (الأول أعلى)
  const podiumHeight = rank === 1 ? 'h-48' : rank === 2 ? 'h-40' : 'h-36';
  const podiumOrder = rank === 2 ? 'order-1' : rank === 1 ? 'order-2' : 'order-3';
  const podiumZIndex = rank === 1 ? 'z-30' : rank === 2 ? 'z-20' : 'z-10';

  return (
    <div className={cn("flex flex-col items-center", podiumOrder)}>
      {/* بطاقة اللاعب */}
      <div 
        className={cn(
          "relative w-full max-w-xs rounded-2xl p-5 border-2 backdrop-blur-sm",
          "transition-all duration-500 hover:scale-105 cursor-default",
          style.border, style.bg, style.glow,
          isCurrentUser && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        {/* شارة "أنت هنا" */}
        {isCurrentUser && (
          <div className="absolute -top-3 -right-3 z-50">
            <Badge className="bg-primary text-primary-foreground gap-1 animate-pulse">
              <Zap className="h-3 w-3" />
              أنت
            </Badge>
          </div>
        )}

        {/* تأثير الوميض للمركز الأول */}
        {rank === 1 && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
        )}

        {/* المحتوى */}
        <div className="relative z-10 text-center space-y-4">
          {/* الشارة والرتبة */}
          <div className="flex items-center justify-center gap-2">
            {style.icon}
            <Badge variant="secondary" className={cn("font-bold", style.badge)}>
              #{rank} {style.label}
            </Badge>
          </div>

          {/* الصورة والاسم */}
          <div className="space-y-2">
            <div className="relative mx-auto">
              <Avatar className={cn(
                "h-20 w-20 border-4 mx-auto transition-transform",
                rank === 1 ? "border-yellow-400 hover:scale-110" : 
                rank === 2 ? "border-slate-300" : "border-amber-500"
              )}>
                <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                <AvatarFallback className={cn("text-2xl font-bold", style.text)}>
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              {/* تاج متحرك للمركز الأول */}
              {rank === 1 && (
                <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-bounce" />
              )}
            </div>

            <div>
              {user.title && (
                <p className={cn("text-sm font-medium", style.text)}>{user.title}</p>
              )}
              <p className="font-bold text-lg text-foreground truncate" title={user.name}>
                {user.name}
              </p>
            </div>
          </div>

          {/* النقاط */}
          <div className={cn(
            "rounded-xl p-3 font-bold",
            rank === 1 ? "bg-yellow-400/20 text-yellow-300" :
            rank === 2 ? "bg-slate-300/20 text-slate-200" :
            "bg-amber-600/20 text-amber-400"
          )}>
            <div className="flex items-center justify-center gap-2">
              <Star className="h-4 w-4" />
              <span className="text-2xl">{user.score.toLocaleString()}</span>
              <span className="text-sm opacity-80">نقطة</span>
            </div>
          </div>

          {/* مؤشرات إضافية */}
          <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              نشط
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              في الصعود
            </span>
          </div>
        </div>
      </div>

      {/* قاعدة المنصة */}
      <div className={cn(
        "w-full max-w-xs rounded-b-2xl border-t-2 border-x-2",
        style.border, style.bg, podiumHeight, podiumZIndex,
        "flex items-end justify-center pb-4"
      )}>
        <div className={cn(
          "w-3/4 rounded-t-lg font-bold text-white/90 text-center py-2",
          rank === 1 ? "bg-gradient-to-t from-yellow-500 to-yellow-400 text-lg" :
          rank === 2 ? "bg-gradient-to-t from-slate-500 to-slate-400" :
          "bg-gradient-to-t from-amber-700 to-amber-600"
        )}>
          #{rank}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: RegularCard (للبقية من القائمة)
// ─────────────────────────────────────────────────────────────

function RegularCard({ user, isCurrentUser }: { user: LeaderboardUser; isCurrentUser: boolean }) {
  const isTop10 = user.rank <= 10;
  
  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
      "bg-card/60 backdrop-blur-sm border-border/60",
      isCurrentUser && "ring-2 ring-primary border-primary/40 bg-primary/5",
      isTop10 && "border-l-4 border-l-primary/40"
    )}>
      <CardContent className="p-4 flex items-center gap-4">
        {/* الرتبة */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
          isTop10 
            ? "bg-primary/20 text-primary font-semibold" 
            : "bg-muted text-muted-foreground"
        )}>
          {user.rank}
        </div>

        {/* الصورة */}
        <Avatar className={cn(
          "h-11 w-11 border-2 transition-transform",
          isCurrentUser ? "border-primary" : "border-border",
          "hover:scale-105"
        )}>
          <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
          <AvatarFallback className="text-sm">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        {/* المعلومات */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-semibold truncate",
              isCurrentUser ? "text-primary" : "text-foreground"
            )} title={user.name}>
              {user.name}
            </p>
            {user.title && (
              <Badge variant="outline" className="text-xs shrink-0">
                {user.title}
              </Badge>
            )}
            {isCurrentUser && (
              <Badge className="bg-primary text-primary-foreground text-xs shrink-0">
                أنت
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {user.score.toLocaleString()} نقطة
          </p>
        </div>

        {/* أيقونة النقاط */}
        <div className="flex items-center gap-1 text-primary font-mono font-semibold">
          <Star className="h-4 w-4" />
          <span>{user.score.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// 🧩 مكون: StatsBanner (شريط الإحصائيات)
// ─────────────────────────────────────────────────────────────

function StatsBanner({ totalPlayers, topScore, avgScore }: { 
  totalPlayers: number; 
  topScore: number; 
  avgScore: number; 
}) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 text-center">
          <Users className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-primary">{totalPlayers}</p>
          <p className="text-xs text-muted-foreground">لاعب نشط</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
        <CardContent className="p-4 text-center">
          <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-500">{topScore.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">أعلى نتيجة</p>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
        <CardContent className="p-4 text-center">
          <TrendingUp className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-500">{Math.round(avgScore)}</p>
          <p className="text-xs text-muted-foreground">متوسط النقاط</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 🎮 المكون الرئيسي: LeaderboardPage
// ─────────────────────────────────────────────────────────────

interface LeaderboardUser {
  rank: number;
  name: string;
  title?: string | null;
  avatarUrl: string | null;
  score: number;
  userId?: string;
}

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { toast } = useToast();

  // جلب البيانات
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('user_id, username, avatar_url, total_score, title')
          .order('total_score', { ascending: false })
          .limit(100);

        if (error) throw error;

        const formattedData: LeaderboardUser[] = (data || []).map((item: any, index: number) => ({
          rank: index + 1,
          userId: item.user_id,
          name: item.username || 'مستخدم مجهول',
          avatarUrl: item.avatar_url,
          score: item.total_score,
          title: item.title,
        }));
        
        setLeaderboard(formattedData);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        toast({ 
          variant: "destructive", 
          title: "خطأ", 
          description: "فشل تحميل قائمة المتصدرين" 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [toast]);

  // حساب الإحصائيات
  const stats = useMemo(() => {
    if (leaderboard.length === 0) return { total: 0, top: 0, avg: 0 };
    return {
      total: leaderboard.length,
      top: leaderboard[0]?.score || 0,
      avg: Math.round(leaderboard.reduce((sum, u) => sum + u.score, 0) / leaderboard.length),
    };
  }, [leaderboard]);

  // هل المستخدم الحالي في القائمة؟
  const currentUserEntry = useMemo(() => {
    if (!currentUser?.id) return null;
    return leaderboard.find(u => u.userId === currentUser.id) || null;
  }, [currentUser?.id, leaderboard]);

  // تقسيم القائمة
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const displayedRest = showAll ? rest : rest.slice(0, 10);

  // ─────────────────────────────────────────
  // ⏳ حالة: التحميل
  // ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
            <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-amber-400 animate-ping" />
          </div>
          <p className="text-lg font-medium">جاري تحديث قائمة الأبطال...</p>
          <p className="text-muted-foreground">نجمع أفضل النتائج لحظة بلحظة</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // 🎬 الواجهة الرئيسية
  // ─────────────────────────────────────────
  return (
    <main className="container mx-auto px-4 py-8">
      {/* العنوان والإحصائيات */}
      <div className="text-center mb-8 space-y-4">
        <div className="relative inline-block">
          <Trophy className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
          <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-amber-400 animate-pulse" />
        </div>
        <h1 className="text-4xl font-headline font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
          🏆 قائمة المتصدرين
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          شاهد أبطال التطبيق وأصحاب أعلى النقاط! هل ستصل للقمة؟
        </p>
      </div>

      {/* شريط الإحصائيات */}
      <StatsBanner 
        totalPlayers={stats.total} 
        topScore={stats.top} 
        avgScore={stats.avg} 
      />

      {leaderboard.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">لا توجد بيانات في القائمة بعد.</p>
            <p className="text-sm text-muted-foreground/70">
              كن أول من يتصدر القائمة! ابدأ اللعب الآن.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* 🥇🥈🥉 منصة التتويج للمراكز الثلاثة */}
          {topThree.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="text-xl font-bold">منصة التتويج</h2>
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              
              {/* ترتيب مرن للمراكز: 2 - 1 - 3 */}
              <div className="flex flex-wrap justify-center items-end gap-4 md:gap-6 py-8">
                {topThree.map((user) => {
                  const rank = user.rank as 1 | 2 | 3;
                  return (
                    <PodiumCard 
                      key={user.rank} 
                      user={user} 
                      rank={rank}
                      isCurrentUser={currentUserEntry?.rank === user.rank}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {/* 📋 بقية القائمة */}
          {rest.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  باقي المتصدرين
                </h2>
                <Badge variant="secondary">{rest.length} لاعب</Badge>
              </div>

              <div className="space-y-2">
                {displayedRest.map(user => (
                  <RegularCard 
                    key={user.rank} 
                    user={user} 
                    isCurrentUser={currentUserEntry?.rank === user.rank}
                  />
                ))}
              </div>

              {/* زر عرض المزيد */}
              {rest.length > 10 && (
                <div className="text-center pt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="gap-2"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        عرض أقل
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        عرض جميع المتصدرين ({rest.length})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </section>
          )}

          {/* 🎯 بطاقة المستخدم الحالي إذا لم يكن في القائمة */}
          {currentUser && !currentUserEntry && (
            <Card className="border-dashed border-primary/40 bg-primary/5">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Trophy className="h-8 w-8 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold">أنت لم تدخل القائمة بعد</p>
                  <p className="text-sm text-muted-foreground">
                    اجمع النقاط وتصدر المراكز!
                  </p>
                </div>
                <Button onClick={() => window.location.href = '/quizzes'}>
                  ابدأ جمع النقاط 🚀
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* تأثيرات CSS مخصصة */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </main>
  );
}
