import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  const { onChange, maxLength, ...restProps } = props

  return (
    (<textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      maxLength={maxLength ?? 240}
      onChange={(event) => {
        if (typeof event.target.value === "string") {
          event.target.value = event.target.value.replace(/[<>]/g, "")
        }
        onChange?.(event)
      }}
      {...restProps} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }

