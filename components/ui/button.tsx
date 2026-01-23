import { ButtonHTMLAttributes, FC } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

export const Button: FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}) => {
  return (
    <button
      className={cn(
        "font-medium rounded-md transition-all duration-200 shadow-sm focus:ring-2 focus:ring-offset-1",
        size === "sm"
          ? "px-3 py-1 text-sm"
          : size === "lg"
          ? "px-6 py-3 text-lg"
          : "px-4 py-2 text-base",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" &&
          "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        variant === "outline" &&
          "border border-primary text-primary hover:bg-primary/10",
        variant === "ghost" &&
          "bg-transparent text-foreground hover:bg-muted",
        variant === "destructive" &&
          "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
