import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  const { onChange, maxLength, ...restProps } = props

  return (
    (<input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      maxLength={maxLength ?? (type === "number" ? undefined : 80)}
      onChange={(event) => {
        if (type !== "number" && typeof event.target.value === "string") {
          event.target.value = event.target.value.replace(/[<>]/g, "")
        }
        onChange?.(event)
      }}
      {...restProps} />)
  );
})
Input.displayName = "Input"

export { Input }
