import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Eye, Sparkles, ArrowRight, Zap, Target, Trophy } from "lucide-react";

async function getStats() {
  const supabase = await createClient();
  
  const [profilesResult, predictionsResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
  ]);

  return {
    prophets: profilesResult.count ?? 0,
    predictions: predictionsResult.count ?? 0,
  };
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // If logged in, show the dashboard
  if (user) {
    const DashboardPage = (await import("./(dashboard)/page")).default;
    return <DashboardPage />;
  }

  // Landing page for logged out users
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-glass-purple px-4 py-1.5 mb-8 border border-glass-border">
          <Sparkles className="h-4 w-4 text-oracle-purple" />
          <span className="text-sm font-medium text-oracle-purple-glow">
            Predictions for 2026
          </span>
        </div>

        {/* Logo */}
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-oracle-purple to-oracle-cyan flex items-center justify-center">
            <Eye className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -inset-2 rounded-3xl bg-oracle-purple/20 blur-2xl -z-10" />
        </div>

        {/* Heading */}
        <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl">
          <span className="text-gradient">The 2026 Oracle</span>
        </h1>

        <p className="text-xl text-text-secondary max-w-2xl mb-12">
          A high-end social prediction market for friends. Make bold predictions
          about 2026. Get scored by AI. Compete for eternal bragging rights.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link href="/signup">
            <Button size="xl" className="gap-2 text-lg px-8">
              Start Predicting
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Sign In
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="glass-card p-6 text-left">
            <div className="h-10 w-10 rounded-xl bg-oracle-purple/20 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-oracle-purple" />
            </div>
            <h3 className="font-display font-bold text-text-primary mb-2">
              AI-Powered Scoring
            </h3>
            <p className="text-sm text-text-muted">
              Our AI Judge evaluates your predictions for boldness and
              specificity in real-time.
            </p>
          </div>

          <div className="glass-card p-6 text-left">
            <div className="h-10 w-10 rounded-xl bg-oracle-cyan/20 flex items-center justify-center mb-4">
              <Target className="h-5 w-5 text-oracle-cyan" />
            </div>
            <h3 className="font-display font-bold text-text-primary mb-2">
              Private Circles
            </h3>
            <p className="text-sm text-text-muted">
              Create groups with friends. Vote on each other&apos;s predictions.
              See who really knows the future.
            </p>
          </div>

          <div className="glass-card p-6 text-left">
            <div className="h-10 w-10 rounded-xl bg-oracle-emerald/20 flex items-center justify-center mb-4">
              <Trophy className="h-5 w-5 text-oracle-emerald" />
            </div>
            <h3 className="font-display font-bold text-text-primary mb-2">
              Compete & Win
            </h3>
            <p className="text-sm text-text-muted">
              Climb the leaderboard. Bold, specific predictions earn higher
              potential payouts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-text-muted">
        <p>The 2026 Oracle — Where prophets are born</p>
      </footer>
    </div>
  );
}

