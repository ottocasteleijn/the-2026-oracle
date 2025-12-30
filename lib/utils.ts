import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format payout odds (e.g., 3.5x)
 */
export function formatOdds(odds: number): string {
  return `${odds.toFixed(1)}x`;
}

/**
 * Format a date relative to now
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get score color class based on value (0-10)
 */
export function getScoreColor(score: number): string {
  if (score < 4) return "text-oracle-rose";
  if (score < 7) return "text-oracle-amber";
  return "text-oracle-emerald";
}

/**
 * Get score background class based on value (0-10)
 */
export function getScoreBgColor(score: number): string {
  if (score < 4) return "bg-oracle-rose/20";
  if (score < 7) return "bg-oracle-amber/20";
  return "bg-oracle-emerald/20";
}

/**
 * Calculate payout odds from scores
 * Formula: (Boldness * 0.8) + (Concreteness * 0.5)
 * Minimum odds: 1.0x
 */
export function calculatePayoutOdds(
  boldness: number,
  concreteness: number
): number {
  const raw = boldness * 0.8 + concreteness * 0.5;
  return Math.max(1.0, Math.round(raw * 10) / 10);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Generate a random avatar placeholder URL
 */
export function generateAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=8b5cf6,06b6d4,ec4899`;
}

/**
 * Debounce function for input handling
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, waitMs);
  };
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

