"use client"

import * as React from "react"
import { ClockIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"))

/** Time-only picker. `value`/`onChange` use 24h "HH:mm" (same shape as a native `<input type="time">`). */
function TimePicker({
  value,
  onChange,
  placeholder = "Heure",
  disabled,
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [hour = "", minute = ""] = value ? value.split(":") : []
  const hourRef = React.useRef<HTMLButtonElement>(null)
  const minuteRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (!open) return
    // Center the current hour/minute in their scroll columns on open.
    const id = requestAnimationFrame(() => {
      hourRef.current?.scrollIntoView({ block: "center" })
      minuteRef.current?.scrollIntoView({ block: "center" })
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  function commit(nextHour: string, nextMinute: string) {
    onChange(`${nextHour}:${nextMinute}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "min-w-0 justify-start overflow-hidden font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <ClockIcon className="shrink-0" />
          <span className="truncate">{value || placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto gap-1 p-2" align="start">
        <div className="max-h-56 w-14 overflow-y-auto">
          {HOURS.map((h) => (
            <button
              key={h}
              ref={h === hour ? hourRef : undefined}
              type="button"
              onClick={() => commit(h, minute || "00")}
              className={cn(
                "block w-full rounded-md px-2 py-1.5 text-center text-sm hover:bg-accent hover:text-accent-foreground",
                h === hour &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="max-h-56 w-14 overflow-y-auto">
          {MINUTES.map((m) => (
            <button
              key={m}
              ref={m === minute ? minuteRef : undefined}
              type="button"
              onClick={() => commit(hour || "00", m)}
              className={cn(
                "block w-full rounded-md px-2 py-1.5 text-center text-sm hover:bg-accent hover:text-accent-foreground",
                m === minute &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { TimePicker }
