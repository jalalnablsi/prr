"use client";

import { useState, useEffect, useMemo, useTransition } from 'react';
import type { Comment as CommentType, Poll } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowBigDown, ArrowBigUp, Award, MessageSquare, Pin } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getTopComment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

export function CommentSection({ comments: initialComments, contentId, contentType }: { comments: CommentType[], contentId: string, contentType: Poll['type'] }) {
  const [comments, setComments] = useState(initialComments);
  const [sortBy, setSortBy] = useState<'top' | 'newest'>('top');
  const [newComment, setNewComment] = useState('');
  const [pinnedCommentId, setPinnedCommentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    startTransition(async () => {
      const topCommentId = await getTopComment(contentId, contentType, comments);
      setPinnedCommentId(topCommentId);
    });
  }, [contentId, contentType, comments]);


  const sortedComments = useMemo(() => {
    const commentsCopy = [...comments];
    if (sortBy === 'newest') {
      return commentsCopy.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    // Default to 'top'
    return commentsCopy.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  }, [comments, sortBy]);

  // Move pinned comment to the top
  const finalComments = useMemo(() => {
    if (!pinnedCommentId) return sortedComments;

    const pinnedComment = sortedComments.find(c => c.id === pinnedCommentId);
    if (!pinnedComment) return sortedComments;

    return [pinnedComment, ...sortedComments.filter(c => c.id !== pinnedCommentId)];
  }, [sortedComments, pinnedCommentId]);

  const handlePostComment = () => {
    if (newComment.trim()) {
      const comment: CommentType = {
        id: `c-new-${Date.now()}`,
        author: { name: 'You', avatarUrl: 'https://picsum.photos/seed/200/40/40' },
        text: newComment,
        upvotes: 0,
        downvotes: 0,
        timestamp: new Date().toISOString(),
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      toast({
        title: "Comment posted!",
        description: "Your voice has been heard.",
      });
    }
  };

  return (
    <Card className="mt-8 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <MessageSquare />
          Comments ({comments.length})
        </CardTitle>
        <div className="flex justify-between items-center pt-4">
          <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'top' | 'newest')}>
            <TabsList>
              <TabsTrigger value="top">Top</TabsTrigger>
              <TabsTrigger value="newest">Newest</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://picsum.photos/seed/200/40/40" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-input"
              />
              <Button onClick={handlePostComment} size="sm" disabled={!newComment.trim()}>Post Comment</Button>
            </div>
          </div>
          <div className="space-y-6 pt-6">
            {finalComments.map((comment) => (
              <Comment key={comment.id} comment={comment} isPinned={comment.id === pinnedCommentId} isPinning={isPending} />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Comment({ comment, isPinned, isPinning }: { comment: CommentType, isPinned: boolean, isPinning: boolean }) {
  const [vote, setVote] = useState(0);

  return (
    <div className="flex gap-4">
      <Avatar>
        <AvatarImage data-ai-hint="person face" src={comment.author.avatarUrl} />
        <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="w-full">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm">{comment.author.name}</p>
          <p className="text-xs text-muted-foreground">{new Date(comment.timestamp).toLocaleDateString()}</p>
          {isPinned && (
            <Badge variant="secondary" className="bg-accent/20 border-accent/30 text-accent">
                <Award className="h-3 w-3 mr-1" /> Pinned by AI
            </Badge>
          )}
          {isPinning && !isPinned && <Skeleton className="w-24 h-5" />}
        </div>
        <p className="text-sm text-foreground/90">{comment.text}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setVote(v => v === 1 ? 0 : 1)}>
            <ArrowBigUp className={`h-4 w-4 ${vote === 1 ? 'fill-primary text-primary' : ''}`} />
          </Button>
          <span className="text-sm font-bold">{comment.upvotes - comment.downvotes + vote}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setVote(v => v === -1 ? 0 : -1)}>
            <ArrowBigDown className={`h-4 w-4 ${vote === -1 ? 'fill-destructive text-destructive' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
