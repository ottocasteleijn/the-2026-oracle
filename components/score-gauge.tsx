"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  label: string;
  value: number;
  maxValue?: number;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "concreteness" | "boldness";
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

const variantGradients = {
  default: "from-oracle-purple via-oracle-cyan to-oracle-purple",
  concreteness: "from-oracle-amber via-oracle-emerald to-oracle-cyan",
  boldness: "from-oracle-rose via-oracle-purple to-oracle-pink",
};

export function ScoreGauge({
  label,
  value,
  maxValue = 10,
  showValue = true,
  size = "md",
  variant = "default",
  className,
  animate = true,
}: ScoreGaugeProps) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  // Determine color based on score
  const getScoreColor = () => {
    const normalized = value / maxValue;
    if (normalized < 0.4) return "text-oracle-rose";
    if (normalized < 0.7) return "text-oracle-amber";
    return "text-oracle-emerald";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {label}
        </span>
        {showValue && (
          <motion.span
            className={cn(
              "font-mono text-sm font-bold",
              getScoreColor()
            )}
            initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
            animate={animate ? { opacity: 1, scale: 1 } : undefined}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            key={value}
          >
            {value.toFixed(0)}
            <span className="text-text-muted">/{maxValue}</span>
          </motion.span>
        )}
      </div>

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-slate-deep",
          sizeClasses[size]
        )}
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {/* Progress bar */}
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
            variantGradients[variant]
          )}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            delay: animate ? 0.1 : 0,
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "linear",
              repeatDelay: 1,
            }}
          />
        </motion.div>

        {/* End cap glow */}
        {percentage > 0 && (
          <motion.div
            className="absolute inset-y-0 w-4 rounded-full bg-white/50 blur-sm"
            initial={{ left: 0, opacity: 0 }}
            animate={{
              left: `calc(${percentage}% - 8px)`,
              opacity: 1,
            }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
          />
        )}
      </div>
    </div>
  );
}

interface PayoutOddsDisplayProps {
  odds: number;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  className?: string;
}

export function PayoutOddsDisplay({
  odds,
  size = "md",
  animate = true,
  className,
}: PayoutOddsDisplayProps) {
  const sizeStyles = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <motion.div
      className={cn(
        "flex items-baseline gap-1 font-display font-bold",
        className
      )}
      initial={animate ? { scale: 0.5, opacity: 0 } : undefined}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      key={odds}
    >
      <span className={cn("text-gradient", sizeStyles[size])}>
        {odds.toFixed(1)}
      </span>
      <span className="text-oracle-purple-glow text-base">×</span>
    </motion.div>
  );
}

