'use client';

import Image from 'next/image';
import { MOCK_LEADERBOARD_USERS } from "@/lib/data";
import type { LeaderboardUser } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
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
  const topThree = MOCK_LEADERBOARD_USERS.slice(0, 3);
  const rest = MOCK_LEADERBOARD_USERS.slice(3);

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
            <Trophy className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-headline font-bold mb-2">قائمة المتصدرين</h1>
            <p className="text-muted-foreground text-lg">شاهد أبطال التطبيق وأصحاب أعلى النقاط!</p>
        </div>
        
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
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold flex-1">{user.name}</p>
                                <p className="text-muted-foreground">{user.score.toLocaleString()} نقطة</p>
                           </CardContent>
                       </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
