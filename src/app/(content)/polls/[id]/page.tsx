"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PollCard } from "@/components/poll-card";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/auth-context';
import { MessageSquare, ArrowBigUp, ArrowBigDown, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export default function PollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [poll, setPoll] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'popular'>('popular');
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userCommentVotes, setUserCommentVotes] = useState<Record<string, 'up' | 'down'>>({});

  // Effect to load votes from localStorage on mount
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      try {
        const storedVotes = localStorage.getItem(`comment-votes-${user.id}`);
        if (storedVotes) {
          setUserCommentVotes(JSON.parse(storedVotes));
        }
      } catch (error) {
        console.error("Failed to parse comment votes from localStorage", error);
      }
    }
  }, [user]);

  // Effect to save votes to localStorage when they change
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`comment-votes-${user.id}`, JSON.stringify(userCommentVotes));
    }
  }, [userCommentVotes, user]);


  useEffect(() => {
    const fetchData = async () => {
      const id = params.id;
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch poll
        const { data: pollData, error: pollError } = await supabase
          .from('content')
          .select('*')
          .eq('id', id)
          .single();

        if (pollError) throw pollError;

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select('*')
          .eq('content_id', id)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;
        
        // This is a client component, so we can fetch user votes for the poll too
        let userVote = null;
        if (user) {
            const { data: voteData } = await supabase
                .from('user_votes')
                .select('option_id')
                .eq('user_id', user.id)
                .eq('content_id', id)
                .single();
            userVote = voteData?.option_id;
        }

        const pollWithDetails = {
          ...pollData,
          comments: commentsData || [],
          userVote: userVote, // Pass the user's vote to the PollCard
        };

        setPoll(pollWithDetails);
        setComments(commentsData || []);
        
      } catch (error) {
        console.error("Error loading page:", error);
        toast({ variant: "destructive", title: "فشل تحميل البيانات" });
        router.push('/polls');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router, toast, user]);

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    if (sortType === 'newest') return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (sortType === 'oldest') return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortType === 'popular') return sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    return sorted;
  }, [comments, sortType]);

  const totalVotes = useMemo(() => {
    if (!poll || !poll.options) return 0;
    return poll.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);
  }, [poll]);

  const handleAddComment = async () => {
    if (!user || !newCommentText.trim()) return;
    setIsSubmittingComment(true);

    const { data, error } = await supabase.from('comments').insert({
      content_id: params.id,
      author_id: user.id,
      author_name: user.first_name || user.username || 'مستخدم',
      author_avatar_url: user.photo_url,
      text: newCommentText,
    }).select().single();

    if (error) {
      toast({ variant: "destructive", title: "فشل إضافة التعليق" });
    } else if (data) {
      const newComments = [data as Comment, ...comments];
      setComments(newComments);
      setPoll(prev => ({ ...prev, comments: newComments }));
      setNewCommentText('');
      toast({ title: "تم إضافة تعليقك" });
    }
    setIsSubmittingComment(false);
  };
  
  const handleVoteComment = async (commentId: string, voteType: 'up' | 'down') => {
    if (!user) {
      toast({ variant: 'destructive', title: 'يجب تسجيل الدخول للتصويت' });
      return;
    }

    const currentVote = userCommentVotes[commentId];
    const isTogglingOff = currentVote === voteType;
    let newVoteState: 'up' | 'down' | undefined = isTogglingOff ? undefined : voteType;

    // This is not atomic and prone to race conditions.
    // A proper solution requires a backend change (DB function).
    // This is the best we can do with the current setup.
    let upvoteChange = 0;
    let downvoteChange = 0;

    if (newVoteState === 'up') {
        upvoteChange = 1;
        if (currentVote === 'down') downvoteChange = -1;
    } else if (newVoteState === 'down') {
        downvoteChange = 1;
        if (currentVote === 'up') upvoteChange = -1;
    } else { // Toggling off
        if (currentVote === 'up') upvoteChange = -1;
        if (currentVote === 'down') downvoteChange = -1;
    }

    // 1. Optimistic UI Update
    const originalComments = [...comments];
    const originalVotes = { ...userCommentVotes };

    setUserCommentVotes(prev => ({...prev, [commentId]: newVoteState}));
    setComments(prev => prev.map(c => 
        c.id === commentId 
        ? {...c, upvotes: c.upvotes + upvoteChange, downvotes: c.downvotes + downvoteChange}
        : c
    ));

    // 2. Backend update (non-atomic, best-effort)
    try {
        const { data: currentComment, error: fetchError } = await supabase
            .from('comments')
            .select('upvotes, downvotes')
            .eq('id', commentId)
            .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
            .from('comments')
            .update({ 
                upvotes: currentComment.upvotes + upvoteChange, 
                downvotes: currentComment.downvotes + downvoteChange 
            })
            .eq('id', commentId);

        if (updateError) throw updateError;
    } catch (error) {
        console.error('Error voting on comment:', error);
        toast({ variant: 'destructive', title: 'فشل التصويت' });
        // Revert UI on error
        setComments(originalComments);
        setUserCommentVotes(originalVotes);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!poll) {
    return <div className="container p-8 text-center">الاستطلاع غير موجود</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
         <PollCard 
            item={poll} 
            votedOptionId={poll.userVote} 
            onVote={(pollId, optionId) => {
                setPoll((prev: any) => ({...prev, userVote: optionId}));
            }} 
         />
      </div>

      <Card className="mb-8 bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span>{comments.length} تعليق</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span>{totalVotes.toLocaleString()}</span>
              <span>مشاركة في التصويت</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">التعليقات</CardTitle>
          <Tabs value={sortType} onValueChange={(v: any) => setSortType(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="popular">الأكثر إعجاباً</TabsTrigger>
              <TabsTrigger value="newest">الأحدث</TabsTrigger>
              <TabsTrigger value="oldest">الأقدم</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photo_url || undefined} />
              <AvatarFallback>{user?.first_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea 
                placeholder="أضف تعليقاً..." 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleAddComment} disabled={!newCommentText.trim() || isSubmittingComment} size="sm">
                  {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ms-2" />}
                  نشر
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sortedComments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={comment.author_avatar_url || undefined} />
                  <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.author_name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.text}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-muted-foreground hover:text-green-600" 
                        onClick={() => handleVoteComment(comment.id, 'up')}
                    >
                      <ArrowBigUp className={`h-4 w-4 ms-1 ${userCommentVotes[comment.id] === 'up' ? 'fill-green-600 text-green-600' : ''}`} /> {comment.upvotes}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-muted-foreground hover:text-red-600" 
                        onClick={() => handleVoteComment(comment.id, 'down')}
                    >
                      <ArrowBigDown className={`h-4 w-4 ms-1 ${userCommentVotes[comment.id] === 'down' ? 'fill-red-600 text-red-600' : ''}`} /> {comment.downvotes}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
