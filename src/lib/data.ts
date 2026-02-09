import type { Poll } from '@/lib/types';
import { subDays } from 'date-fns';

export const MOCK_DATA: Poll[] = [
  // --- Polls ---
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
  {
    id: '9',
    type: 'poll',
    category: 'sports',
    question: 'من سيفوز بالدوري الإنجليزي الممتاز هذا الموسم؟',
    options: [
      { id: '9-1', text: 'مانشستر سيتي', votes: 1500 },
      { id: '9-2', text: 'ليفربول', votes: 1100 },
      { id: '9-3', text: 'آرسنال', votes: 950 },
      { id: '9-4', text: 'فريق آخر', votes: 200 },
    ],
    comments: [],
  },
  {
    id: '10',
    type: 'poll',
    category: 'general',
    question: 'أي فصل من فصول السنة تفضل؟',
    options: [
      { id: '10-1', text: 'الشتاء', votes: 800 },
      { id: '10-2', text: 'الربيع', votes: 1200 },
      { id: '10-3', text: 'الصيف', votes: 600 },
      { id: '10-4', text: 'الخريف', votes: 550 },
    ],
    comments: [],
  },

  // --- Predictions ---
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

  // --- Daily Challenge Questions ---
  {
    id: 'dc-1',
    type: 'challenge',
    category: 'sports',
    question: 'من هو الهداف التاريخي لبطولة كأس العالم لكرة القدم؟',
    correctOptionId: 'dc-1-2',
    beatPercentage: 75,
    options: [
      { id: 'dc-1-1', text: 'ليونيل ميسي', votes: 500 },
      { id: 'dc-1-2', text: 'ميروسلاف كلوزه', votes: 250 },
      { id: 'dc-1-3', text: 'رونالدو الظاهرة', votes: 400 },
      { id: 'dc-1-4', text: 'بيليه', votes: 300 },
    ],
    comments: [],
  },
  {
    id: 'dc-2',
    type: 'challenge',
    category: 'science',
    question: 'ما هو أسرع حيوان بري في العالم؟',
    correctOptionId: 'dc-2-1',
    beatPercentage: 88,
    options: [
      { id: 'dc-2-1', text: 'الفهد', votes: 1200 },
      { id: 'dc-2-2', text: 'الأسد', votes: 150 },
      { id: 'dc-2-3', text: 'الغزال', votes: 200 },
    ],
    comments: [],
  },
  {
    id: 'dc-3',
    type: 'challenge',
    category: 'general',
    question: 'ما هي عاصمة أستراليا؟',
    correctOptionId: 'dc-3-4',
    beatPercentage: 60,
    options: [
      { id: 'dc-3-1', text: 'سيدني', votes: 950 },
      { id: 'dc-3-2', text: 'ملبورن', votes: 600 },
      { id: 'dc-3-3', text: 'بيرث', votes: 100 },
      { id: 'dc-3-4', text: 'كانبرا', votes: 400 },
    ],
    comments: [],
  },
  {
    id: 'dc-4',
    type: 'challenge',
    category: 'tech',
    question: 'ماذا تعني "CSS" في تطوير الويب؟',
    correctOptionId: 'dc-4-1',
    beatPercentage: 92,
    options: [
      { id: 'dc-4-1', text: 'Cascading Style Sheets', votes: 1800 },
      { id: 'dc-4-2', text: 'Creative Style Solutions', votes: 50 },
      { id: 'dc-4-3', text: 'Computer Style Syntax', votes: 75 },
    ],
    comments: [],
  },
  {
    id: 'dc-5',
    type: 'challenge',
    category: 'math',
    question: 'ما هو ناتج 15 * (4 + 6) / 2 ؟',
    correctOptionId: 'dc-5-3',
    beatPercentage: 82,
    options: [
      { id: 'dc-5-1', text: '150', votes: 890 },
      { id: 'dc-5-2', text: '50', votes: 345 },
      { id: 'dc-5-3', text: '75', votes: 1560 },
      { id: 'dc-5-4', text: '100', votes: 410 },
    ],
    comments: [],
  },

  // --- Categorized Quizzes ---
  // Islamic
  {
    id: 'islamic-easy-1',
    type: 'challenge',
    category: 'islamic',
    question: 'ما هو الشهر الذي أنزل فيه القرآن الكريم؟',
    difficulty: 'easy',
    correctOptionId: 'ie1-1',
    beatPercentage: 95,
    options: [
      { id: 'ie1-1', text: 'شهر رمضان', votes: 1800 },
      { id: 'ie1-2', text: 'شهر شوال', votes: 50 },
      { id: 'ie1-3', text: 'شهر ذو الحجة', votes: 25 },
    ],
    comments: [],
  },
  {
    id: 'islamic-medium-1',
    type: 'challenge',
    category: 'islamic',
    question: 'من هو الصحابي الذي اهتز لموته عرش الرحمن؟',
    difficulty: 'medium',
    correctOptionId: 'im1-2',
    beatPercentage: 68,
    options: [
      { id: 'im1-1', text: 'عمر بن الخطاب', votes: 450 },
      { id: 'im1-2', text: 'سعد بن معاذ', votes: 1250 },
      { id: 'im1-3', text: 'أبو بكر الصديق', votes: 300 },
    ],
    comments: [],
  },
  {
    id: 'islamic-hard-1',
    type: 'challenge',
    category: 'islamic',
    question: 'ما هي السورة التي وردت فيها سجدتان؟',
    difficulty: 'hard',
    correctOptionId: 'ih1-3',
    beatPercentage: 45,
    options: [
      { id: 'ih1-1', text: 'سورة السجدة', votes: 900 },
      { id: 'ih1-2', text: 'سورة فصلت', votes: 420 },
      { id: 'ih1-3', text: 'سورة الحج', votes: 680 },
    ],
    comments: [],
  },
   // Science
  {
    id: 'science-easy-1',
    type: 'challenge',
    category: 'science',
    difficulty: 'easy',
    question: 'ما هو الكوكب المعروف باسم "الكوكب الأحمر"؟',
    correctOptionId: 'se1-1',
    beatPercentage: 98,
    options: [
      { id: 'se1-1', text: 'المريخ', votes: 2500 },
      { id: 'se1-2', text: 'الزهرة', votes: 100 },
      { id: 'se1-3', text: 'المشتري', votes: 150 },
    ],
    comments: [],
  },
  {
    id: 'science-medium-1',
    type: 'challenge',
    category: 'science',
    difficulty: 'medium',
    question: 'ما هو العنصر الكيميائي الذي رمزه "O"؟',
    correctOptionId: 'sm1-2',
    beatPercentage: 85,
    options: [
      { id: 'sm1-1', text: 'الذهب', votes: 200 },
      { id: 'sm1-2', text: 'الأكسجين', votes: 1800 },
      { id: 'sm1-3', text: 'الفضة', votes: 120 },
    ],
    comments: [],
  },
  // General
  {
    id: 'general-medium-1',
    type: 'challenge',
    category: 'general',
    difficulty: 'medium',
    question: 'في أي بلد تقع مدينة البتراء الأثرية؟',
    correctOptionId: 'gm1-3',
    beatPercentage: 78,
    options: [
      { id: 'gm1-1', text: 'مصر', votes: 300 },
      { id: 'gm1-2', text: 'السعودية', votes: 150 },
      { id: 'gm1-3', text: 'الأردن', votes: 1900 },
    ],
    comments: [],
  },
];
