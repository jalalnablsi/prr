export type Comment = {
  id: string;
  author: {
    name: string;
    avatarUrl: string;
  };
  text: string;
  upvotes: number;
  downvotes: number;
  timestamp: string;
};

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  type: 'poll' | 'challenge' | 'prediction';
  question: string;
  options: PollOption[];
  comments: Comment[];
  endsAt?: string; // For challenges
  timeframe?: 'week' | 'month' | 'year'; // For predictions
};
