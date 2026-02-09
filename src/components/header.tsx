import Link from 'next/link'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Menu, PlusCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="me-4 flex">
          <Link href="/" className="me-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold font-headline">
              مختبر الدوبامين
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/polls"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              استطلاعات
            </Link>
            <Link
              href="/challenges"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              التحدي اليومي
            </Link>
             <Link
              href="/quizzes"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              اختبارات
            </Link>
            <Link
              href="/predictions"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              توقعات
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Link href="/submit">
            <Button size="sm">
              <PlusCircle className="ms-2 h-4 w-4" />
              مشاركة جديدة
            </Button>
          </Link>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">فتح القائمة</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs p-6">
                <Link href="/" className="me-6 flex items-center space-x-2 mb-6">
                    <Icons.logo className="h-6 w-6" />
                    <span className="font-bold font-headline text-lg">
                    مختبر الدوبامين
                    </span>
                </Link>
                <nav className="grid gap-4">
                  <Link href="/polls" className="text-muted-foreground hover:text-foreground">استطلاعات</Link>
                  <Link href="/challenges" className="text-muted-foreground hover:text-foreground">التحدي اليومي</Link>
                  <Link href="/quizzes" className="text-muted-foreground hover:text-foreground">اختبارات</Link>
                  <Link href="/predictions" className="text-muted-foreground hover:text-foreground">توقعات</Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
