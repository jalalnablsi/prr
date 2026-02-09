import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";

export default function ChallengesPage() {
  const challenges = MOCK_DATA.filter(item => item.type === 'challenge' && item.category !== 'islamic');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">التحدي اليومي</h1>
      <p className="text-muted-foreground mb-8">يقوم المسؤول بنشر مجموعة من الأسئلة يومياً. أجب عليها واجمع النقاط!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map(challenge => (
          <PollCard key={challenge.id} item={challenge} />
        ))}
      </div>
    </div>
  );
}
