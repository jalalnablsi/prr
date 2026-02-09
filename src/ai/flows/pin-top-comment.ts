'use server';

/**
 * @fileOverview Automatically identifies and pins the most insightful or helpful comment on each poll and prediction.
 *
 * - pinTopComment - A function that handles the process of identifying and pinning the top comment.
 * - PinTopCommentInput - The input type for the pinTopComment function.
 * - PinTopCommentOutput - The return type for the pinTopComment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PinTopCommentInputSchema = z.object({
  comments: z
    .array(
      z.object({
        commentId: z.string().describe('The unique identifier of the comment.'),
        text: z.string().describe('The text content of the comment.'),
        upvotes: z.number().describe('The number of upvotes the comment has received.'),
        downvotes: z.number().describe('The number of downvotes the comment has received.'),
      })
    )
    .describe('An array of comments to evaluate for pinning.'),
  contentType: z
    .enum(['poll', 'prediction'])
    .describe('The type of content the comments are associated with (poll or prediction).'),
  contentId: z.string().describe('The unique identifier of the poll or prediction.'),
});

export type PinTopCommentInput = z.infer<typeof PinTopCommentInputSchema>;

const PinTopCommentOutputSchema = z.object({
  pinnedCommentId: z.string().optional().describe('The ID of the comment that should be pinned.'),
  reason: z
    .string()
    .optional()
    .describe('The reason why this comment was selected. Empty if no comment was selected.'),
});

export type PinTopCommentOutput = z.infer<typeof PinTopCommentOutputSchema>;

export async function pinTopComment(input: PinTopCommentInput): Promise<PinTopCommentOutput> {
  return pinTopCommentFlow(input);
}

const pinTopCommentPrompt = ai.definePrompt({
  name: 'pinTopCommentPrompt',
  input: {schema: PinTopCommentInputSchema},
  output: {schema: PinTopCommentOutputSchema},
  prompt: `Given a list of comments for a {{contentType}} with ID {{contentId}}, determine which comment is the most insightful or helpful and should be pinned. Return the comment ID and the reason for selecting it.\n\nComments:\n{{#each comments}}\n  - ID: {{commentId}}\n    Text: {{text}}\n    Upvotes: {{upvotes}}\n    Downvotes: {{downvotes}}\n{{/each}}\n\nConsider factors such as the comment's relevance to the topic, the quality of its reasoning, and its overall contribution to the discussion. If no comment is suitable for pinning, return an empty pinnedCommentId.\n\nOutput in JSON format. The pinnedCommentId should be null if no comment is suitable for pinning, and the reason should explain your choice. If a pinnedCommentId is specified, the reason should not be empty.
`,
});

const pinTopCommentFlow = ai.defineFlow(
  {
    name: 'pinTopCommentFlow',
    inputSchema: PinTopCommentInputSchema,
    outputSchema: PinTopCommentOutputSchema,
  },
  async input => {
    if (!input.comments || input.comments.length === 0) {
      return {pinnedCommentId: undefined, reason: 'No comments to evaluate.'};
    }

    // Sort comments by upvotes - downvotes to prioritize highly-rated comments
    const sortedComments = [...input.comments].sort((a, b) => (
      (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
    ));

    //Limit to top 5
    const topComments = sortedComments.slice(0, 5);

    const {output} = await pinTopCommentPrompt({...input, comments: topComments});
    return output!;
  }
);
