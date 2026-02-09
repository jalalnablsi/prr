import type { Poll } from '@/lib/types';
import { subDays, addDays, addHours } from 'date-fns';

export const MOCK_DATA: Poll[] = [
  {
    id: '1',
    type: 'poll',
    question: 'Which programming language do you prefer for frontend development?',
    options: [
      { id: '1-1', text: 'React (with Next.js)', votes: 1204 },
      { id: '1-2', text: 'Vue.js (with Nuxt)', votes: 745 },
      { id: '1-3', text: 'SvelteKit', votes: 432 },
      { id: '1-4', text: 'Angular', votes: 210 },
    ],
    comments: [
      {
        id: 'c1-1',
        author: { name: 'Alex', avatarUrl: 'https://picsum.photos/seed/101/40/40' },
        text: 'Next.js App Router is a game changer. The performance improvements with Server Components are just incredible.',
        upvotes: 42,
        downvotes: 2,
        timestamp: subDays(new Date(), 1).toISOString(),
      },
      {
        id: 'c1-2',
        author: { name: 'Sarah', avatarUrl: 'https://picsum.photos/seed/102/40/40' },
        text: "I'm a huge fan of Vue's simplicity and reactivity system. It just feels more intuitive to me.",
        upvotes: 28,
        downvotes: 1,
        timestamp: subDays(new Date(), 2).toISOString(),
      },
       {
        id: 'c1-3',
        author: { name: 'Mike', avatarUrl: 'https://picsum.photos/seed/103/40/40' },
        text: "Don't sleep on SvelteKit! The compiler approach is genius, no virtual DOM overhead.",
        upvotes: 15,
        downvotes: 0,
        timestamp: subDays(new Date(), 3).toISOString(),
      },
    ],
  },
  {
    id: '2',
    type: 'challenge',
    question: 'Will Bitcoin reach $100,000 by the end of this year?',
    endsAt: addHours(new Date(), 8).toISOString(),
    options: [
      { id: '2-1', text: 'Yes, easily!', votes: 890 },
      { id: '2-2', text: 'No, market is too volatile.', votes: 1560 },
    ],
    comments: [
       {
        id: 'c2-1',
        author: { name: 'CryptoKing', avatarUrl: 'https://picsum.photos/seed/104/40/40' },
        text: 'The halving event combined with institutional investment makes $100k not a matter of if, but when.',
        upvotes: 55,
        downvotes: 10,
        timestamp: subDays(new Date(), 1).toISOString(),
      },
    ],
  },
  {
    id: '3',
    type: 'prediction',
    question: 'Will AI replace software developers in the next 10 years?',
    timeframe: 'year',
    options: [
      { id: '3-1', text: 'Yes, completely.', votes: 320 },
      { id: '3-2', text: 'It will be a powerful tool, not a replacement.', votes: 2400 },
      { id: '3-3', text: 'No, human creativity is irreplaceable.', votes: 980 },
    ],
    comments: [
        {
        id: 'c3-1',
        author: { name: 'DevRel', avatarUrl: 'https://picsum.photos/seed/105/40/40' },
        text: "It's all about augmentation, not replacement. AI will handle the boilerplate, letting developers focus on complex problem-solving and architecture. The role will evolve, not disappear.",
        upvotes: 120,
        downvotes: 3,
        timestamp: subDays(new Date(), 4).toISOString(),
      },
      {
        id: 'c3-2',
        author: { name: 'Futurist', avatarUrl: 'https://picsum.photos/seed/106/40/40' },
        text: "People said the same about factory workers. Any task that can be broken down into logical steps will eventually be automated.",
        upvotes: 30,
        downvotes: 25,
        timestamp: subDays(new Date(), 2).toISOString(),
      },
    ],
  },
  {
    id: '4',
    type: 'poll',
    question: 'What is your favorite code editor?',
    options: [
      { id: '4-1', text: 'VS Code', votes: 3100 },
      { id: '4-2', text: 'JetBrains IDEs (WebStorm, etc.)', votes: 950 },
      { id: '4-3', text: 'Neovim / Vim', votes: 620 },
      { id: '4-4', text: 'Sublime Text', votes: 150 },
    ],
    comments: [
       {
        id: 'c4-1',
        author: { name: 'VimWizard', avatarUrl: 'https://picsum.photos/seed/107/40/40' },
        text: 'Once you master modal editing in Vim, everything else feels slow and inefficient. The learning curve is steep but worth it.',
        upvotes: 78,
        downvotes: 5,
        timestamp: subDays(new Date(), 1).toISOString(),
      },
    ],
  },
];
