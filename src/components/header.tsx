import Link from 'next/link'
import { Icons } from '@/components/icons'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-center md:justify-start">
        <div className="flex">
          <Link href="/" className="flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline">
              مختبر الدوبامين
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
