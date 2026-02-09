"use client";

import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Timer } from 'lucide-react';

export function QuestionTimer({
  duration,
  onTimeUp,
  isPaused,
}: {
  duration: number;
  onTimeUp: () => void;
  isPaused: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isPaused) return;

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp, isPaused]);

  return (
    <Badge variant={timeLeft <= 5 ? "destructive" : "secondary"} className="text-lg tabular-nums px-3 py-1">
      <Timer className="ms-2 h-4 w-4" />
      {timeLeft}
    </Badge>
  );
}
