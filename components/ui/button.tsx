import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oracle-purple focus-visible:ring-offset-2 focus-visible:ring-offset-abyss disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-oracle-purple to-oracle-purple-dim text-white shadow-[var(--shadow-neon-purple)] hover:from-oracle-purple-glow hover:to-oracle-purple hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]",
        secondary:
          "bg-glass-purple text-oracle-purple-glow border border-glass-border backdrop-blur-sm hover:bg-oracle-purple/20 hover:border-oracle-purple",
        outline:
          "border border-slate-mid bg-transparent text-text-secondary hover:border-oracle-purple hover:text-oracle-purple",
        ghost:
          "text-text-secondary hover:bg-glass-white hover:text-text-primary",
        destructive:
          "bg-oracle-rose/20 text-oracle-rose border border-oracle-rose/30 hover:bg-oracle-rose/30",
        link: "text-oracle-purple underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

