import * as React from "react";
import { cn } from "@/lib/utils";

export type ChipProps = React.HTMLAttributes<HTMLSpanElement>;

const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full bg-surface-light text-text-sub text-[12px] leading-[16px] font-medium",
          className
        )}
        {...props}
      />
    );
  }
);
Chip.displayName = "Chip";

export { Chip };
