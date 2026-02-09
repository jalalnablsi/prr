import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users } from "lucide-react";
import type { Poll } from "@/lib/types";

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

  const getHref = (item: Poll) => {
    // In a real app, you might have different paths, but we'll unify them for this example.
    return `/polls/${item.id}`;
  };

  return (
    <Link href={getHref(item)} className="block group">
      <Card className="h-full flex flex-col bg-card/80 hover:bg-card/100 hover:border-primary/50 transition-all duration-200 transform hover:-translate-y-1">
        <CardHeader>
          <div className="flex justify-between items-start mb-2">
            <CardTitle className="font-headline text-lg">{item.question}</CardTitle>
            <Badge variant={getBadgeVariant(item)} className="capitalize shrink-0 ml-4">
              {item.type}
            </Badge>
          </div>
          <CardDescription>
            {item.type === 'challenge' && item.endsAt
              ? `Challenge ends soon!`
              : `Join the discussion and cast your vote.`}
          </CardDescription>
        </CardHeader>
        <CardFooter className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{totalVotes.toLocaleString()} votes</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span>{item.comments.length} comments</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
