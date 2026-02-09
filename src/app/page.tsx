import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flame, Lightbulb, Vote } from "lucide-react";
import Link from "next/link";
import { Icons } from "@/components/icons";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        <section className="container mx-auto px-4 md:px-6 py-12 md:py-24 text-center">
          <div className="flex justify-center mb-8">
            <Icons.logo className="h-16 w-16" />
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            DopamineLab
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground md:text-xl mb-8">
            The ultimate hub for challenges, polls, and predictions. Engage, vote, and see where you stand.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <FeatureCard
              href="/polls"
              icon={<Vote className="h-8 w-8 text-primary" />}
              title="Community Polls"
              description="Vote on trending topics and see what the community thinks."
            />
            <FeatureCard
              href="/challenges"
              icon={<Flame className="h-8 w-8 text-primary" />}
              title="Daily Challenges"
              description="Test your knowledge and instincts with new challenges every day."
            />
            <FeatureCard
              href="/predictions"
              icon={<Lightbulb className="h-8 w-8 text-primary" />}
              title="Make Predictions"
              description="Predict future events and see if the community agrees with you."
            />
          </div>
        </section>
      </main>
      <footer className="text-center p-6 text-muted-foreground text-sm">
        Built for the future of social engagement.
      </footer>
    </div>
  );
}

function FeatureCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full bg-card/50 hover:bg-card/90 hover:border-accent transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-primary/20">
        <CardHeader className="flex flex-col items-center text-center p-6">
          <div className="p-4 bg-muted rounded-full mb-4 transition-colors duration-300 group-hover:bg-accent/20">
            {icon}
          </div>
          <CardTitle className="font-headline text-xl mb-2">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
