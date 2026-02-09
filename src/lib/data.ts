import type { Poll } from '@/lib/types';
import { subDays, addHours } from 'date-fns';

export const MOCK_DATA: Poll[] = [
  // User-generated Poll
  {
    id: '1',
    type: 'poll',
    category: 'tech',
    question: 'ما هي لغة البرمجة التي تفضلها لتطوير الواجهات الأمامية؟',
    options: [
      { id: '1-1', text: 'React (مع Next.js)', votes: 1204 },
      { id: '1-2', text: 'Vue.js (مع Nuxt)', votes: 745 },
      { id: '1-3', text: 'SvelteKit', votes: 432 },
      { id: '1-4', text: 'Angular', votes: 210 },
    ],
    comments: [
      {
        id: 'c1-1',
        author: { name: 'أليكس', avatarUrl: 'https://picsum.photos/seed/101/40/40' },
        text: 'App Router في Next.js يغير قواعد اللعبة. تحسينات الأداء مع مكونات الخادم لا تصدق.',
        upvotes: 42,
        downvotes: 2,
        timestamp: subDays(new Date(), 1).toISOString(),
      },
      {
        id: 'c1-2',
        author: { name: 'سارة', avatarUrl: 'https://picsum.photos/seed/102/40/40' },
        text: "أنا من أشد المعجبين ببساطة Vue ونظام التفاعلية الخاص به. أشعر أنه أكثر سهولة.",
        upvotes: 28,
        downvotes: 1,
        timestamp: subDays(new Date(), 2).toISOString(),
      },
    ],
  },
   // User-generated Poll with Images
  {
    id: '5',
    type: 'poll',
    category: 'tech',
    question: 'أي هاتف ستختار؟',
    options: [
      { id: '5-1', text: 'iPhone 15 Pro', votes: 980, imageUrl: 'https://picsum.photos/seed/phone1/600/400' },
      { id: '5-2', text: 'Samsung Galaxy S24 Ultra', votes: 1120, imageUrl: 'https://picsum.photos/seed/phone2/600/400' },
      { id: '5-3', text: 'Xiaomi 14 Ultra', votes: 650, imageUrl: 'https://picsum.photos/seed/phone3/600/400' },
    ],
    comments: [
      {
        id: 'c5-1',
        author: { name: 'تقني', avatarUrl: 'https://picsum.photos/seed/108/40/40' },
        text: 'كاميرا السامسونج لا تقبل المنافسة هذا العام!',
        upvotes: 33,
        downvotes: 4,
        timestamp: subDays(new Date(), 1).toISOString(),
      }
    ]
  },
  // Admin-generated Daily Challenge (Quiz)
  {
    id: '2',
    type: 'challenge',
    category: 'math',
    question: 'ما هو ناتج 15 * (4 + 6) / 2 ؟',
    endsAt: addHours(new Date(), 8).toISOString(),
    correctOptionId: '2-3',
    beatPercentage: 82,
    options: [
      { id: '2-1', text: '150', votes: 890 },
      { id: '2-2', text: '50', votes: 345 },
      { id: '2-3', text: '75', votes: 1560 },
      { id: '2-4', text: '100', votes: 410 },
    ],
    comments: [],
  },
  // User-generated Prediction
  {
    id: '3',
    type: 'prediction',
    category: 'tech',
    question: 'هل سيحل الذكاء الاصطناعي محل مطوري البرمجيات في السنوات العشر القادمة؟',
    timeframe: 'year',
    options: [
      { id: '3-1', text: 'نعم، بالكامل.', votes: 320 },
      { id: '3-2', text: 'سيكون أداة قوية، وليس بديلاً.', votes: 2400 },
      { id: '3-3', text: 'لا، الإبداع البشري لا يمكن تعويضه.', votes: 980 },
    ],
    comments: [
        {
        id: 'c3-1',
        author: { name: 'مطور علاقات', avatarUrl: 'https://picsum.photos/seed/105/40/40' },
        text: "الأمر كله يتعلق بالتعزيز، وليس الاستبدال. سيتعامل الذكاء الاصطناعي مع المهام المتكررة، مما يتيح للمطورين التركيز على حل المشكلات المعقدة والهندسة. سيتطور الدور، ولن يختفي.",
        upvotes: 120,
        downvotes: 3,
        timestamp: subDays(new Date(), 4).toISOString(),
      },
    ],
  },
  // Admin-generated Islamic Question (Quiz) - Easy
  {
    id: '6',
    type: 'challenge',
    category: 'islamic',
    question: 'ما هو الشهر الذي أنزل فيه القرآن الكريم؟',
    difficulty: 'easy',
    correctOptionId: '6-1',
    beatPercentage: 95,
    options: [
      { id: '6-1', text: 'شهر رمضان', votes: 1800 },
      { id: '6-2', text: 'شهر شوال', votes: 50 },
      { id: '6-3', text: 'شهر ذو الحجة', votes: 25 },
    ],
    comments: [],
  },
  // Admin-generated Islamic Question (Quiz) - Medium
  {
    id: '7',
    type: 'challenge',
    category: 'islamic',
    question: 'من هو الصحابي الذي اهتز لموته عرش الرحمن؟',
    difficulty: 'medium',
    correctOptionId: '7-2',
    beatPercentage: 68,
    options: [
      { id: '7-1', text: 'عمر بن الخطاب', votes: 450 },
      { id: '7-2', text: 'سعد بن معاذ', votes: 1250 },
      { id: '7-3', text: 'أبو بكر الصديق', votes: 300 },
    ],
    comments: [],
  },
    // Admin-generated Islamic Question (Quiz) - Hard
  {
    id: '8',
    type: 'challenge',
    category: 'islamic',
    question: 'ما هي السورة التي وردت فيها سجدتان؟',
    difficulty: 'hard',
    correctOptionId: '8-3',
    beatPercentage: 45,
    options: [
      { id: '8-1', text: 'سورة السجدة', votes: 900 },
      { id: '8-2', text: 'سورة فصلت', votes: 420 },
      { id: '8-3', text: 'سورة الحج', votes: 680 },
    ],
    comments: [],
  },
];
