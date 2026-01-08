import { ButtonHTMLAttributes, FC } from "react"
import clsx from "clsx"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
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
      className={clsx(
        "font-medium rounded-md transition-all duration-200 shadow-sm",
        // sizes
        size === "sm" ? "px-3 py-1 text-sm" :
        size === "lg" ? "px-6 py-3 text-lg" :
        "px-4 py-2 text-base",
        // variants
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        variant === "outline" && "border border-primary text-primary hover:bg-primary/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
