"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types/database";
import { Trophy, TrendingUp, Target, Crown, Medal, Award } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}

const rankIcons = [Crown, Medal, Award];
const rankColors = ["text-oracle-amber", "text-slate-400", "text-orange-400"];

export function LeaderboardTable({
  entries,
  currentUserId,
  className,
}: LeaderboardTableProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-oracle-amber to-oracle-purple flex items-center justify-center">
          <Trophy className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-text-primary">
            Leaderboard
          </h2>
          <p className="text-sm text-text-muted">
            Top prophets by potential winnings
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-glass-border text-xs font-mono uppercase tracking-wider text-text-muted">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Prophet</div>
          <div className="col-span-2 text-center">Predictions</div>
          <div className="col-span-2 text-center">Accuracy</div>
          <div className="col-span-2 text-right">Potential</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-glass-border">
          {entries.map((entry, index) => {
            const RankIcon = rankIcons[index] ?? null;
            const rankColor = rankColors[index] ?? "text-text-muted";
            const isCurrentUser = entry.user_id === currentUserId;
            const accuracy =
              entry.predictions_count > 0
                ? (entry.correct_predictions / entry.predictions_count) * 100
                : 0;

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "grid grid-cols-12 gap-4 px-6 py-4 transition-colors hover:bg-glass-white/50",
                  isCurrentUser && "bg-oracle-purple/10"
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center">
                  {RankIcon ? (
                    <RankIcon className={cn("h-5 w-5", rankColor)} />
                  ) : (
                    <span className="text-lg font-bold text-text-muted">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Prophet */}
                <div className="col-span-5 flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={entry.avatar_url ?? undefined}
                      alt={entry.display_name}
                    />
                    <AvatarFallback>
                      {entry.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-text-primary flex items-center gap-2">
                      {entry.display_name}
                      {isCurrentUser && (
                        <Badge variant="default" className="text-xs">
                          You
                        </Badge>
                      )}
                    </p>
                  </div>
                </div>

                {/* Predictions Count */}
                <div className="col-span-2 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 text-text-secondary">
                    <Target className="h-4 w-4 text-oracle-cyan" />
                    <span>{entry.predictions_count}</span>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="col-span-2 flex items-center justify-center">
                  <Badge
                    variant={
                      accuracy >= 70
                        ? "success"
                        : accuracy >= 40
                          ? "warning"
                          : "secondary"
                    }
                  >
                    {accuracy.toFixed(0)}%
                  </Badge>
                </div>

                {/* Potential Winnings */}
                <div className="col-span-2 flex items-center justify-end">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-oracle-emerald" />
                    <span className="font-mono font-bold text-oracle-emerald">
                      {formatCurrency(entry.total_potential_winnings)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-slate-mid mb-4" />
            <p className="text-text-muted">No predictions yet</p>
            <p className="text-sm text-text-muted">
              Be the first to make a prediction!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for sidebar/widgets
export function LeaderboardCompact({
  entries,
  currentUserId,
  className,
}: LeaderboardTableProps) {
  return (
    <div className={cn("glass-card p-4 space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-oracle-amber" />
        <h3 className="font-display font-bold text-text-primary">Top Prophets</h3>
      </div>

      <div className="space-y-3">
        {entries.slice(0, 5).map((entry, index) => {
          const isCurrentUser = entry.user_id === currentUserId;

          return (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg transition-colors",
                isCurrentUser && "bg-oracle-purple/10"
              )}
            >
              <span
                className={cn(
                  "font-bold w-5 text-center",
                  index === 0
                    ? "text-oracle-amber"
                    : index === 1
                      ? "text-slate-400"
                      : index === 2
                        ? "text-orange-400"
                        : "text-text-muted"
                )}
              >
                {index + 1}
              </span>

              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={entry.avatar_url ?? undefined}
                  alt={entry.display_name}
                />
                <AvatarFallback className="text-xs">
                  {entry.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {entry.display_name}
                </p>
              </div>

              <span className="text-sm font-mono text-oracle-emerald">
                {formatCurrency(entry.total_potential_winnings)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

