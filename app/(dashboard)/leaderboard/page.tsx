import { createClient } from "@/lib/supabase/server";
import { LeaderboardTable } from "@/components/leaderboard-table";
import type { LeaderboardEntry } from "@/types/database";
import { Trophy } from "lucide-react";

async function getFullLeaderboard(): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: 100 });

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return [];
  }

  return (data ?? []).map((entry: Omit<LeaderboardEntry, 'rank'>, index: number) => ({
    ...entry,
    rank: index + 1,
  }));
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export default async function LeaderboardPage() {
  const [leaderboard, user] = await Promise.all([
    getFullLeaderboard(),
    getCurrentUser(),
  ]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-oracle-amber to-oracle-purple mb-6">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-gradient">Prophet Leaderboard</span>
          </h1>
          <p className="text-text-secondary max-w-xl mx-auto">
            The top oracles ranked by their potential winnings. Make bold, specific
            predictions to climb the ranks.
          </p>
        </div>

        {/* Leaderboard Table */}
        <LeaderboardTable
          entries={leaderboard}
          currentUserId={user?.id}
        />
      </div>
    </div>
  );
}

