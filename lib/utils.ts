import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn() – Class Name utility
 * 
 * Combines conditional classNames with Tailwind class conflict resolution.
 * 
 * Example:
 * cn("p-4", isActive && "bg-primary", "text-sm")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
