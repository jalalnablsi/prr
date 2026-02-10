"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Trophy, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// تعريف واجهة المستخدم ليتوافق مع البيانات
interface LeaderboardUser {
  rank: number;
  name: string;
  title?: string | null;
  avatarUrl: string | null;
  score: number;
}

const getRankColor = (rank: number) => {
    switch (rank) {
        case 1: return "border-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20";
        case 2: return "border-slate-400 bg-slate-400/10 hover:bg-slate-400/20";
        case 3: return "border-amber-600 bg-amber-600/10 hover:bg-amber-600/20";
        default: return "border-border bg-card/50 hover:bg-card/80";
    }
}

function LeaderboardCard({ user }: { user: LeaderboardUser }) {
    return (
        <Card className={cn("transition-all", getRankColor(user.rank))}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-lg w-6 text-center">{user.rank}</span>
                    {user.rank === 1 && <Crown className="h-6 w-6 text-yellow-400" />}
                </div>
                <Avatar className="h-12 w-12 border-2 border-primary/50">
                    <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    {user.title ? (
                        <>
                            <p className="font-bold text-lg">{user.title}</p>
                            <p className="text-md text-foreground/80">{user.name}</p>
                        </>
                    ) : (
                        <p className="font-bold text-lg">{user.name}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{user.score.toLocaleString()} نقطة</p>
                </div>
            </CardContent>
        </Card>
    )
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // جلب البيانات من جدول leaderboard مرتبة حسب النقاط تنازلياً
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(100); // جلب أفضل 100 مستخدم

      if (error) {
        console.error('Error fetching leaderboard:', error);
        toast({ variant: "destructive", title: "خطأ في جلب القائمة" });
      } else if (data) {
        // تحويل البيانات من قاعدة البيانات إلى الشكل الذي يتوقعه المكون
        const formattedData: LeaderboardUser[] = data.map((item: any, index: number) => {
          // إضافة ألقاب بسيطة لأصحاب المراتب الثلاثة الأولى
          let title: string | null = null;
          if (index === 0) title = "البطل";
          else if (index === 1) title = "الوصيف";
          else if (index === 2) title = "المركز الثالث";

          return {
            rank: index + 1,
            name: item.username || 'مستخدم مجهول', // استخدام username من قاعدة البيانات
            avatarUrl: item.avatar_url, // استخدام avatar_url
            score: item.total_score, // استخدام total_score
            title: title
          };
        });
        
        setLeaderboard(formattedData);
      }
      
      setLoading(false);
    };

    fetchLeaderboard();
  }, [toast]);

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">جاري تحديث قائمة المتصدرين...</p>
            </div>
        </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
            <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-headline font-bold mb-2">قائمة المتصدرين</h1>
            <p className="text-muted-foreground text-lg">شاهد أبطال التطبيق وأصحاب أعلى النقاط!</p>
        </div>
        
        {leaderboard.length === 0 ? (
             <div className="text-center text-muted-foreground">لا توجد بيانات في القائمة بعد.</div>
        ) : (
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Top Three */}
                <div className="space-y-4">
                  {topThree.map(user => <LeaderboardCard key={user.rank} user={user} />)}
                </div>

                {/* Rest of the list */}
                {rest.length > 0 && (
                    <div className="space-y-3 pt-6">
                        {rest.map(user => (
                           <Card key={user.rank} className="bg-card/50">
                               <CardContent className="p-3 flex items-center gap-4 text-sm">
                                   <span className="font-semibold text-muted-foreground w-6 text-center">{user.rank}</span>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatarUrl || undefined} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold flex-1 truncate" title={user.name}>{user.name}</p>
                                    <p className="text-muted-foreground font-mono">{user.score.toLocaleString()}</p>
                               </CardContent>
                           </Card>
                        ))}
                    </div>
                )}
            </div>
        )}
    </div>
  );
}