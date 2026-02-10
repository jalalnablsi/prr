'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import type { Poll } from '@/lib/types'; 
import { PollCard } from "@/components/poll-card";
import { Loader2 } from "lucide-react";
import { useAuth } from '@/context/auth-context';

export default function PredictionsPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotesMap, setUserVotesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: predictionsData, error: predictionsError } = await supabase
        .from('content')
        .select('*')
        .eq('type', 'prediction')
        .order('created_at', { ascending: false });

      if (predictionsError) {
        console.error('Error fetching predictions:', predictionsError);
      } else if (predictionsData) {
        setPredictions(predictionsData as Poll[]);
      }

      if (user) {
        const { data: votesData, error: votesError } = await supabase
          .from('user_votes')
          .select('content_id, option_id')
          .eq('user_id', user.id);
        
        if (votesData && !votesError) {
          const map: Record<string, string> = {};
          votesData.forEach(v => {
            map[v.content_id] = v.option_id;
          });
          setUserVotesMap(map);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-headline font-bold mb-2">التوقعات</h1>
      <p className="text-muted-foreground mb-8">ماذا يحمل المستقبل؟ شارك بتوقعك وانظر إذا كان الآخرون يوافقونك الرأي.</p>
      
      {predictions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions.map(prediction => (
            <PollCard 
              key={prediction.id} 
              item={prediction}
              votedOptionId={userVotesMap[prediction.id]}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-16 p-8 border-2 border-dashed rounded-lg">
            <p className="text-lg">لا توجد توقعات متاحة حاليًا.</p>
        </div>
      )}
    </div>
  );
}
