import Link from 'next/link'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline">
              DopamineLab
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/polls"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Polls
            </Link>
            <Link
              href="/challenges"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Challenges
            </Link>
            <Link
              href="/predictions"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Predictions
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end">
          <Link href="/submit">
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
