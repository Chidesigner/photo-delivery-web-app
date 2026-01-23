import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-10 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    />
  );
}

export { Input };
