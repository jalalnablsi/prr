import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";

export default function IslamicPage() {
  const items = MOCK_DATA.filter(item => item.category === 'islamic');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">أسئلة إسلامية</h1>
      <p className="text-muted-foreground mb-8">اختبر معرفتك في العلوم الإسلامية.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <PollCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
