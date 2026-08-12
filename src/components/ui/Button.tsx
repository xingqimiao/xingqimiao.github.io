import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text" | "glass";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-full text-label-large px-6 py-2.5 transition-all duration-300",
          {
            "bg-[#121317] !text-white hover:bg-[#3C4043] dark:bg-[#f4f5f7] dark:!text-[#121317] dark:hover:bg-white/85 transition-colors duration-200": variant === "primary",
            "bg-black/5 border border-black/10 backdrop-blur-md hover:bg-black/10 text-text-main dark:bg-white/5 dark:border-white/12 dark:hover:bg-white/10": variant === "secondary",
            "bg-transparent hover:bg-black/5 text-text-main dark:hover:bg-white/10": variant === "text",
            "bg-white/10 !text-white backdrop-blur-lg hover:bg-white/20 transition-all duration-300 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]": variant === "glass",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
