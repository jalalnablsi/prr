import { MOCK_DATA } from "@/lib/data";
import { PollCard } from "@/components/poll-card";

export default function PredictionsPage() {
  const predictions = MOCK_DATA.filter(item => item.type === 'prediction');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">Predictions</h1>
      <p className="text-muted-foreground mb-8">What does the future hold? Make your prediction and see if others agree.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {predictions.map(prediction => (
          <PollCard key={prediction.id} item={prediction} />
        ))}
      </div>
    </div>
  );
}
