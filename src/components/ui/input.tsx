import * as React from "react";

import { shouldAutoScrollOnFocus } from "@/lib/focus-scroll";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, ...props }, ref) => {
    const handleFocus = React.useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (shouldAutoScrollOnFocus()) {
        setTimeout(() => {
          e.target.scrollIntoView?.({ block: 'center', inline: 'nearest' });
        }, 280);
      }
      onFocus?.(e);
    }, [onFocus]);

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-border bg-secondary/50 shadow-sm px-4 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring focus-visible:bg-secondary/80 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        onFocus={handleFocus}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
