import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";

export default function PollsPage() {
  const polls = MOCK_DATA.filter(item => item.type === 'poll');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">Community Polls</h1>
      <p className="text-muted-foreground mb-8">See what the community thinks. Cast your vote!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map(poll => (
          <PollCard key={poll.id} item={poll} />
        ))}
      </div>
    </div>
  );
}
