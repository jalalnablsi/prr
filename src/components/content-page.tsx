"use client";

import { useState, useMemo } from 'react';
import type { Poll, PollOption } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CommentSection } from './comment-section';
import { useToast } from '@/hooks/use-toast';
import { CountdownTimer } from './countdown-timer';

export function ContentPage({ item }: { item: Poll }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [options, setOptions] = useState<PollOption[]>(item.options);
  const { toast } = useToast();

  const totalVotes = useMemo(() => {
    return options.reduce((sum, option) => sum + option.votes, 0);
  }, [options]);

  const handleVote = () => {
    if (selectedOption) {
      setHasVoted(true);
      setOptions(currentOptions =>
        currentOptions.map(opt =>
          opt.id === selectedOption ? { ...opt, votes: opt.votes + 1 } : opt
        )
      );
      const chosenOptionText = options.find(o => o.id === selectedOption)?.text;
      toast({
        title: "Vote cast!",
        description: `You voted for "${chosenOptionText}".`,
      });
    }
  };

  const isChallengeEnded = item.type === 'challenge' && item.endsAt && new Date(item.endsAt) <= new Date();
  const canVote = !hasVoted && !isChallengeEnded;

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-3xl font-headline font-bold">{item.question}</CardTitle>
            {item.type === 'challenge' && item.endsAt && <CountdownTimer endsAt={item.endsAt} />}
          </div>
          <CardDescription className="text-lg text-muted-foreground">
            {hasVoted ? "Here are the results so far." : "Select an option and cast your vote."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {options.map((option) => {
              const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
              const isSelected = option.id === selectedOption;

              return (
                <div key={option.id}>
                  {hasVoted ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <p className={`font-medium ${isSelected ? 'text-primary' : ''}`}>{option.text}</p>
                        <p className={`font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{percentage.toFixed(1)}%</p>
                      </div>
                      <Progress value={percentage} className={isSelected ? '[&>div]:bg-primary' : ''} />
                    </div>
                  ) : (
                    <Button
                      variant={isSelected ? 'default' : 'secondary'}
                      className="w-full justify-start h-auto py-3 px-4 text-left"
                      onClick={() => setSelectedOption(option.id)}
                    >
                      {option.text}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
          {!hasVoted && (
            <div className="mt-6 text-center">
              <Button size="lg" onClick={handleVote} disabled={!selectedOption || !canVote}>
                {isChallengeEnded ? 'Challenge Ended' : 'Cast My Vote'}
              </Button>
            </div>
          )}
          {hasVoted && selectedOption && (
            <div className="mt-6 text-center text-sm text-accent p-3 bg-accent/10 rounded-lg">
                You voted with {((options.find(o => o.id === selectedOption)!.votes / totalVotes) * 100).toFixed(0)}% of participants.
            </div>
          )}
        </CardContent>
      </Card>

      <CommentSection comments={item.comments} contentId={item.id} contentType={item.type} />
    </div>
  );
}
