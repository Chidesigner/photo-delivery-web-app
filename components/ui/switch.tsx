"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export default function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  className,
}: SwitchProps) {
  const handleClick = React.useCallback(() => {
    onCheckedChange(!checked)
  }, [checked, onCheckedChange])

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        // Use Tailwind colors directly
        checked ? "bg-green-500" : "bg-gray-300",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  )
}
