"use client";

import { useState, useCallback } from "react";
import type { VoteType } from "@/types/database";

interface UseVoteOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useVote(options?: UseVoteOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const castVote = useCallback(
    async (predictionId: string, vote: VoteType) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prediction_id: predictionId, vote }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to cast vote");
        }

        options?.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options?.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const removeVote = useCallback(
    async (predictionId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/votes?prediction_id=${predictionId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error ?? "Failed to remove vote");
        }

        options?.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        options?.onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  return {
    castVote,
    removeVote,
    isLoading,
    error,
  };
}

