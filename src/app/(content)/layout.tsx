import { Header } from "@/components/header";
import { BottomNavBar } from "@/components/bottom-nav-bar";

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNavBar />
    </div>
  );
}
