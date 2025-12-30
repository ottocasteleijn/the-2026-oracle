import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-oracle-purple/20 text-oracle-purple-glow border border-oracle-purple/30",
        secondary:
          "bg-slate-mid/50 text-text-secondary border border-slate-mid",
        success:
          "bg-oracle-emerald/20 text-oracle-emerald border border-oracle-emerald/30",
        warning:
          "bg-oracle-amber/20 text-oracle-amber border border-oracle-amber/30",
        danger:
          "bg-oracle-rose/20 text-oracle-rose border border-oracle-rose/30",
        cyan:
          "bg-oracle-cyan/20 text-oracle-cyan border border-oracle-cyan/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

