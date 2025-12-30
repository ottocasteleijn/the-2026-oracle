"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreGauge, PayoutOddsDisplay } from "@/components/score-gauge";
import { cn, formatRelativeTime, formatCurrency } from "@/lib/utils";
import type { PredictionWithDetails, VoteType } from "@/types/database";
import {
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface PredictionCardProps {
  prediction: PredictionWithDetails;
  currentUserId?: string | undefined;
  userVote?: VoteType | undefined;
  onVote?: ((predictionId: string, vote: VoteType) => void) | undefined;
  className?: string | undefined;
  index?: number | undefined;
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "default" as const,
    icon: Clock,
  },
  correct: {
    label: "Correct",
    variant: "success" as const,
    icon: CheckCircle,
  },
  incorrect: {
    label: "Incorrect",
    variant: "danger" as const,
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    variant: "secondary" as const,
    icon: XCircle,
  },
};

export function PredictionCard({
  prediction,
  currentUserId,
  userVote,
  onVote,
  className,
  index = 0,
}: PredictionCardProps) {
  const status = statusConfig[prediction.status];
  const StatusIcon = status.icon;
  const isOwnPrediction = currentUserId === prediction.user_id;
  const totalVotes = prediction.agreed_count + prediction.doubt_count;

  const handleVote = (vote: VoteType) => {
    if (isOwnPrediction || !onVote) return;
    onVote(prediction.id, vote);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.05,
      }}
      whileHover={{ y: -4 }}
      className={cn("glass-card overflow-hidden", className)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={prediction.author_avatar ?? undefined}
              alt={prediction.author_name}
            />
            <AvatarFallback>
              {prediction.author_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-text-primary">
              {prediction.author_name}
            </p>
            <p className="text-xs text-text-muted">
              {formatRelativeTime(prediction.created_at)}
            </p>
          </div>
        </div>

        <Badge variant={status.variant} className="gap-1.5">
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </Badge>
      </div>

      {/* Prediction Content */}
      <div className="px-5 pb-4">
        <p className="text-text-primary leading-relaxed">
          {prediction.content}
        </p>
      </div>

      {/* AI Comment */}
      <div className="mx-5 mb-4 rounded-lg bg-glass-purple/50 p-3 border border-glass-border">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-oracle-purple shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary italic">
            &ldquo;{prediction.ai_comment}&rdquo;
          </p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4 px-5 pb-4">
        <ScoreGauge
          label="Concreteness"
          value={prediction.concreteness_score}
          variant="concreteness"
          size="sm"
          animate={false}
        />
        <ScoreGauge
          label="Boldness"
          value={prediction.boldness_score}
          variant="boldness"
          size="sm"
          animate={false}
        />
      </div>

      {/* Payout & Voting Section */}
      <div className="flex items-center justify-between border-t border-glass-border px-5 py-4 bg-glass-white/50">
        {/* Payout Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-oracle-cyan" />
            <PayoutOddsDisplay odds={prediction.payout_odds} size="sm" animate={false} />
          </div>
          <div className="h-6 w-px bg-slate-mid" />
          <div className="text-sm">
            <span className="text-text-muted">Potential: </span>
            <span className="font-semibold text-oracle-emerald">
              {formatCurrency(prediction.potential_payout)}
            </span>
          </div>
        </div>

        {/* Voting Buttons */}
        {!isOwnPrediction && onVote && (
          <div className="flex items-center gap-2">
            <Button
              variant={userVote === "agreed" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleVote("agreed")}
              className={cn(
                "gap-1.5",
                userVote === "agreed" && "bg-oracle-emerald/20 text-oracle-emerald hover:bg-oracle-emerald/30"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{prediction.agreed_count}</span>
            </Button>
            <Button
              variant={userVote === "doubt" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleVote("doubt")}
              className={cn(
                "gap-1.5",
                userVote === "doubt" && "bg-oracle-rose/20 text-oracle-rose hover:bg-oracle-rose/30"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{prediction.doubt_count}</span>
            </Button>
          </div>
        )}

        {/* Own prediction - show vote counts only */}
        {isOwnPrediction && totalVotes > 0 && (
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4 text-oracle-emerald" />
              {prediction.agreed_count}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="h-4 w-4 text-oracle-rose" />
              {prediction.doubt_count}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Skeleton loader for prediction cards
export function PredictionCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-slate-mid" />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-slate-mid" />
            <div className="h-3 w-16 rounded bg-slate-deep" />
          </div>
        </div>
        <div className="h-5 w-16 rounded-full bg-slate-mid" />
      </div>

      <div className="px-5 pb-4 space-y-2">
        <div className="h-4 w-full rounded bg-slate-mid" />
        <div className="h-4 w-3/4 rounded bg-slate-mid" />
      </div>

      <div className="mx-5 mb-4 rounded-lg bg-slate-deep p-3">
        <div className="h-4 w-full rounded bg-slate-mid" />
      </div>

      <div className="grid grid-cols-2 gap-4 px-5 pb-4">
        <div className="h-2 rounded bg-slate-mid" />
        <div className="h-2 rounded bg-slate-mid" />
      </div>

      <div className="flex items-center justify-between border-t border-glass-border px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="h-6 w-12 rounded bg-slate-mid" />
          <div className="h-6 w-20 rounded bg-slate-mid" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 rounded bg-slate-mid" />
          <div className="h-8 w-16 rounded bg-slate-mid" />
        </div>
      </div>
    </div>
  );
}

