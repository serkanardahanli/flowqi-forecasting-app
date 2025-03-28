"use client"

import * as React from "react"
import { cn } from "@/app/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
    className?: string
  }
>(({ className, value = 0, max = 100, ...props }, ref) => {
  const percentage = value && max ? (value / max) * 100 : 0

  return (
    <div
      ref={ref}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}
      {...props}
    >
      <div
        className="h-full bg-indigo-600 transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress } 