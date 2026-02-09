import { notFound } from 'next/navigation';
import { MOCK_DATA } from '@/lib/data';
import { ContentPage } from '@/components/content-page';

export default function PollDetailPage({ params }: { params: { id: string } }) {
  const item = MOCK_DATA.find((p) => p.id === params.id);

  if (!item) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ContentPage item={item} />
    </div>
  );
}

export function generateStaticParams() {
  return MOCK_DATA.map((poll) => ({
    id: poll.id,
  }));
}
