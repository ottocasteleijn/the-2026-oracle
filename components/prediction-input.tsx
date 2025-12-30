"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { experimental_useObject as useObject } from "ai/react";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScoreGauge, PayoutOddsDisplay } from "@/components/score-gauge";
import { Badge } from "@/components/ui/badge";
import { cn, calculatePayoutOdds, debounce } from "@/lib/utils";
import {
  Sparkles,
  AlertTriangle,
  Send,
  Loader2,
  Eye,
  Zap,
  Target,
} from "lucide-react";

const judgeSchema = z.object({
  concreteness_score: z.number(),
  boldness_score: z.number(),
  ai_comment: z.string(),
});

interface PredictionInputProps {
  groupId?: string; // Reserved for future use
  onSubmit?: (prediction: {
    content: string;
    concreteness_score: number;
    boldness_score: number;
    payout_odds: number;
    ai_comment: string;
  }) => Promise<void>;
  className?: string;
}

export function PredictionInput({
  groupId: _groupId,
  onSubmit,
  className,
}: PredictionInputProps) {
  const [prediction, setPrediction] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Streaming AI analysis
  const { object, submit, isLoading } = useObject({
    api: "/api/judge",
    schema: judgeSchema,
  });

  // Debounced analysis trigger
  const debouncedAnalyze = useCallback(
    (text: string) => {
      if (text.length >= 20) {
        submit({ prediction: text });
        setShowAnalysis(true);
      }
    },
    [submit]
  );

  // Create debounced version
  const debouncedSubmit = useCallback(
    debounce(debouncedAnalyze, 800),
    [debouncedAnalyze]
  );

  // Trigger analysis as user types
  useEffect(() => {
    if (prediction.length >= 20) {
      debouncedSubmit(prediction);
    } else {
      setShowAnalysis(false);
    }
  }, [prediction, debouncedSubmit]);

  // Calculate derived values
  const concreteness = object?.concreteness_score ?? 0;
  const boldness = object?.boldness_score ?? 0;
  const payoutOdds = calculatePayoutOdds(boldness, concreteness);
  const isValid = concreteness >= 4;
  const canSubmit = prediction.length >= 20 && isValid && !isLoading;

  const handleSubmit = async () => {
    if (!canSubmit || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: prediction,
        concreteness_score: concreteness,
        boldness_score: boldness,
        payout_odds: payoutOdds,
        ai_comment: object?.ai_comment ?? "",
      });
      setPrediction("");
      setShowAnalysis(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main input container */}
      <div className="glass-purple rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-oracle-purple to-oracle-cyan flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <motion.div
                className="absolute -inset-1 rounded-xl bg-oracle-purple/30 blur-md -z-10"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-text-primary">
                Make Your Prediction
              </h2>
              <p className="text-sm text-text-muted">
                What will happen in 2026?
              </p>
            </div>
          </div>

          {/* Analysis status indicator */}
          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <div className="relative flex items-center gap-2 rounded-full bg-oracle-cyan/10 px-3 py-1.5 border border-oracle-cyan/30">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4 text-oracle-cyan" />
                  </motion.div>
                  <span className="text-xs font-mono text-oracle-cyan">
                    ANALYZING<span className="loading-dots" />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea with HUD overlay */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="In 2026, Bitcoin will exceed $200,000 by December 31st..."
            className="min-h-[160px] resize-none pr-16"
            maxLength={1000}
          />

          {/* Character count */}
          <div className="absolute bottom-3 right-3 text-xs font-mono text-text-muted">
            {prediction.length}/1000
          </div>

          {/* Scanline effect when analyzing */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none overflow-hidden rounded-[var(--radius-button)]"
              >
                <motion.div
                  className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-oracle-cyan to-transparent"
                  animate={{ y: ["0%", "16000%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analysis HUD Panel */}
        <AnimatePresence>
          {showAnalysis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 pt-2">
                {/* HUD Header */}
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-oracle-cyan">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Real-Time Oracle Analysis</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-oracle-cyan/50 to-transparent" />
                </div>

                {/* Scores Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Concreteness */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-oracle-cyan" />
                      <span className="text-sm font-medium text-text-secondary">
                        Concreteness
                      </span>
                    </div>
                    <ScoreGauge
                      label=""
                      value={concreteness}
                      variant="concreteness"
                      size="lg"
                      showValue
                    />
                    {concreteness < 4 && concreteness > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-xs text-oracle-rose"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Too vague - be more specific!</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Boldness */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-oracle-purple" />
                      <span className="text-sm font-medium text-text-secondary">
                        Boldness
                      </span>
                    </div>
                    <ScoreGauge
                      label=""
                      value={boldness}
                      variant="boldness"
                      size="lg"
                      showValue
                    />
                  </div>

                  {/* Payout Odds */}
                  <div className="flex flex-col items-center justify-center space-y-2 rounded-xl bg-glass-white p-4">
                    <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                      Potential Payout
                    </span>
                    <PayoutOddsDisplay odds={payoutOdds} size="lg" />
                    <Badge variant={isValid ? "success" : "danger"}>
                      {isValid ? "Ready to Submit" : "Needs Work"}
                    </Badge>
                  </div>
                </div>

                {/* AI Comment */}
                <AnimatePresence mode="wait">
                  {object?.ai_comment && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="relative rounded-xl bg-obsidian/50 p-4 border border-glass-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-oracle-purple to-oracle-pink flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-mono uppercase tracking-wider text-oracle-purple">
                            The Oracle Says
                          </p>
                          <p className="text-sm text-text-primary italic">
                            &ldquo;{object.ai_comment}&rdquo;
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-text-muted">
            {prediction.length < 20
              ? `Type at least ${20 - prediction.length} more characters to see analysis`
              : isValid
                ? "Your prediction is ready to be recorded in the Oracle"
                : "Make your prediction more specific to submit"}
          </p>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            size="lg"
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Prediction
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

