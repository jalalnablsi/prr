"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from './ui/badge';

export function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const endDate = new Date(endsAt);

    if (endDate <= new Date()) {
      setTimeLeft('Challenge ended');
      return;
    }

    const calculateTimeLeft = () => {
      const distance = formatDistanceToNow(endDate, { addSuffix: true });
      setTimeLeft(`Ends ${distance}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000 * 60); // Update every minute

    return () => clearInterval(interval);
  }, [endsAt]);

  if (!timeLeft) return null;

  return <Badge variant="destructive">{timeLeft}</Badge>;
}
