import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Tag } from "lucide-react";
import type { Poll } from "@/lib/types";

const categoryTranslations: Record<Poll['category'], string> = {
  sports: 'رياضة',
  games: 'ألعاب',
  math: 'رياضيات',
  puzzles: 'ألغاز',
  islamic: 'إسلامية',
  tech: 'تقنية',
  general: 'عام',
};


export function PollCard({ item }: { item: Poll }) {
  const totalVotes = item.options.reduce((sum, option) => sum + option.votes, 0);

  const getBadgeVariant = (type: Poll['type']) => {
    switch (type) {
      case 'challenge':
        return 'destructive';
      case 'prediction':
        return 'secondary';
      case 'poll':
      default:
        return 'default';
    }
  };

  const getBadgeContent = (type: Poll['type']) => {
    switch (type) {
      case 'challenge':
        return 'تحدي';
      case 'prediction':
        return 'توقع';
      case 'poll':
      default:
        return 'استطلاع';
    }
  };

  const getHref = (item: Poll) => {
    return `/polls/${item.id}`;
  };

  return (
    <Link href={getHref(item)} className="block group">
      <Card className="h-full flex flex-col bg-card/80 hover:bg-card/100 hover:border-primary/50 transition-all duration-200 transform hover:-translate-y-1">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="font-headline text-lg">{item.question}</CardTitle>
            <Badge variant={getBadgeVariant(item.type)} className="shrink-0 ms-4">
              {getBadgeContent(item.type)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Tag className="h-3 w-3" />
            <span>{categoryTranslations[item.category] || item.category}</span>
          </div>
          <CardDescription>
            {item.type === 'challenge' && item.endsAt
              ? `التحدي سينتهي قريباً!`
              : `شارك في النقاش وأدلي بصوتك.`}
          </CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{totalVotes.toLocaleString()} صوت</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{item.comments.length} تعليق</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
