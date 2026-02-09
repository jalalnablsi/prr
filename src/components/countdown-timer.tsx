"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Badge } from './ui/badge';

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const endDate = new Date(endsAt);

    const calculateTimeLeft = () => {
      if (endDate <= new Date()) {
        setTimeLeft('انتهى التحدي');
        if(interval) clearInterval(interval);
        return;
      }
      const distance = formatDistanceToNow(endDate, { addSuffix: true, locale: arSA });
      setTimeLeft(`ينتهي ${distance}`);
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000 * 30); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [endsAt]);

  if (!timeLeft) return null;

  return <Badge variant="destructive">{timeLeft}</Badge>;
}
