import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/icons/logo";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <Logo />
      <h1 className="mt-6 text-4xl font-bold text-center text-foreground">
        Welcome to Skailan
      </h1>
      <p className="mt-4 text-lg text-center text-muted-foreground max-w-2xl">
        Your unified platform for intelligent customer conversations across all channels.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row gap-4">
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
       <p className="mt-12 text-sm text-center text-muted-foreground">
        (Authentication via Supabase. Full multi-tenancy is a backend feature.)
      </p>
    </div>
  );
}
