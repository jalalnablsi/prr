'use server';

import { pinTopComment } from '@/ai/flows/pin-top-comment';
import type { Comment } from '@/lib/types';

export async function getTopComment(
  contentId: string,
  contentType: 'poll' | 'prediction' | 'challenge',
  comments: Comment[]
) {
  if (comments.length === 0) {
    return null;
  }

  try {
    const { pinnedCommentId } = await pinTopComment({
      comments: comments.map(c => ({
        commentId: c.id,
        text: c.text,
        upvotes: c.upvotes,
        downvotes: c.downvotes,
      })),
      contentId,
      // The AI flow only knows about 'poll' and 'prediction', so we map 'challenge' to 'poll'.
      contentType: contentType === 'challenge' ? 'poll' : contentType,
    });
    return pinnedCommentId ?? null;
  } catch (error) {
    console.error('Error pinning top comment:', error);
    // In a real app, you'd want more robust error handling/logging.
    return null;
  }
}
