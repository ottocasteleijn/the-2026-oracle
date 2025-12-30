import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PredictionInput } from "@/components/prediction-input";
import { PredictionCard, PredictionCardSkeleton } from "@/components/prediction-card";
import { LeaderboardCompact } from "@/components/leaderboard-table";
import type { PredictionWithDetails, LeaderboardEntry } from "@/types/database";
import { Eye, Sparkles, Users, TrendingUp } from "lucide-react";

async function getPredictions(): Promise<PredictionWithDetails[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("prediction_with_votes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching predictions:", error);
    return [];
  }

  return data as PredictionWithDetails[];
}

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: 10 });

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return (data ?? []).map((entry, index: number) => {
    const e = entry as Omit<LeaderboardEntry, 'rank'>;
    return {
      user_id: e.user_id,
      display_name: e.display_name,
      avatar_url: e.avatar_url,
      total_potential_winnings: e.total_potential_winnings,
      predictions_count: e.predictions_count,
      correct_predictions: e.correct_predictions,
      rank: index + 1,
    };
  });
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function PredictionsFeed({ predictions }: { predictions: PredictionWithDetails[] }) {
  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-2xl bg-glass-purple flex items-center justify-center mb-4">
          <Eye className="h-8 w-8 text-oracle-purple" />
        </div>
        <h3 className="font-display text-xl font-bold text-text-primary mb-2">
          No Predictions Yet
        </h3>
        <p className="text-text-muted max-w-md">
          Be the first oracle! Make a bold prediction about what will happen in 2026.
        </p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {predictions.map((prediction, index) => (
        <PredictionCard
          key={prediction.id}
          prediction={prediction}
          index={index}
        />
      ))}
    </div>
  );
}

function PredictionsFeedSkeleton() {
  return (
    <div className="masonry-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <PredictionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const [predictions, leaderboard, user] = await Promise.all([
    getPredictions(),
    getLeaderboard(),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-oracle-purple/10 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-glass-purple px-4 py-1.5 mb-6 border border-glass-border">
            <Sparkles className="h-4 w-4 text-oracle-purple" />
            <span className="text-sm font-medium text-oracle-purple-glow">
              The Future Awaits
            </span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-gradient">The 2026 Oracle</span>
          </h1>
          
          <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Make bold predictions about 2026. The AI Judge scores your prophecy.
            The bolder and more specific, the higher your potential payout.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-text-muted">
              <Users className="h-4 w-4 text-oracle-cyan" />
              <span>{leaderboard.length} Prophets</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <Eye className="h-4 w-4 text-oracle-purple" />
              <span>{predictions.length} Predictions</span>
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <TrendingUp className="h-4 w-4 text-oracle-emerald" />
              <span>
                ${leaderboard.reduce((sum, e) => sum + e.total_potential_winnings, 0).toLocaleString()} at stake
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column - Prediction Input & Feed */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prediction Input */}
            {user && (
              <PredictionInput
                onSubmit={async (prediction) => {
                  "use server";
                  // TODO: Save prediction to database
                  console.log("Prediction submitted:", prediction);
                }}
              />
            )}

            {!user && (
              <div className="glass-purple rounded-2xl p-8 text-center">
                <Eye className="h-12 w-12 text-oracle-purple mx-auto mb-4" />
                <h2 className="font-display text-xl font-bold text-text-primary mb-2">
                  Join the Oracle
                </h2>
                <p className="text-text-secondary mb-6">
                  Sign in to make your predictions and compete with friends.
                </p>
                <a
                  href="/login"
                  className="btn-oracle btn-oracle-primary inline-flex"
                >
                  Sign In to Predict
                </a>
              </div>
            )}

            {/* Predictions Feed */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <h2 className="font-display text-xl font-bold text-text-primary">
                  Recent Prophecies
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-glass-border to-transparent" />
              </div>

              <Suspense fallback={<PredictionsFeedSkeleton />}>
                <PredictionsFeed predictions={predictions} />
              </Suspense>
            </div>
          </div>

          {/* Sidebar - Leaderboard */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <LeaderboardCompact
                entries={leaderboard}
                currentUserId={user?.id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

