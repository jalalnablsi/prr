"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Vote, Flame, BrainCircuit, Fingerprint, Trophy, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/polls', icon: Vote, label: 'استطلاعات' },
  { href: '/predictions', icon: Lightbulb, label: 'توقعات' },
  { href: '/challenges', icon: Flame, label: 'التحدي' },
  { href: '/leaderboard', icon: Trophy, label: 'المتصدرون' },
  { href: '/quizzes', icon: BrainCircuit, label: 'اختبارات' },
  { href: '/stranger', icon: Fingerprint, label: 'غريب بيننا' },
];

export function BottomNavBar() {
  const pathname = usePathname();

  const getIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
    // This logic handles nested routes, e.g. /polls/some-id will still activate the /polls tab
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-screen-sm items-center justify-around">
        
        {navItems.map((item) => {
          const isActive = getIsActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-[11px] sm:text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
      </div>
    </nav>
  );
}
