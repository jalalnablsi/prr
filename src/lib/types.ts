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
  imageUrl?: string;
};

export type Poll = {
  id: string;
  type: 'poll' | 'challenge' | 'prediction';
  category: 'sports' | 'games' | 'math' | 'puzzles' | 'islamic' | 'tech' | 'general' | 'science';
  question: string;
  options: PollOption[];
  comments: Comment[];
  endsAt?: string; // For challenges
  timeframe?: 'week' | 'month' | 'year'; // For predictions
  correctOptionId?: string; // For quizzes/challenges
  difficulty?: 'easy' | 'medium' | 'hard'; // For islamic questions, etc.
  beatPercentage?: number; // For quizzes, percentage of users the player beat
};
