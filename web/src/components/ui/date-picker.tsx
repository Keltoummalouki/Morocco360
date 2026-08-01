"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"

function parseLocalDate(datePart: string | undefined): Date | undefined {
  if (!datePart) return undefined
  const [y, m, d] = datePart.split("-").map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}

function formatLocalDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatLabel(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** Date-only picker. `value`/`onChange` use "yyyy-MM-dd" (same shape as a native `<input type="date">`). */
function DatePicker({
  value,
  onChange,
  placeholder = "Choisir une date",
  disabled,
  className,
  "aria-invalid": ariaInvalid,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  "aria-invalid"?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const selected = parseLocalDate(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          className={cn(
            "w-full min-w-0 justify-start overflow-hidden font-normal",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="shrink-0" />
          <span className="truncate">{selected ? formatLabel(selected) : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          onSelect={(date) => {
            if (!date) return
            onChange(formatLocalDate(date))
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Date + time picker. `value`/`onChange` use "yyyy-MM-ddTHH:mm" (same shape as a native `<input type="datetime-local">`). */
function DateTimePicker({
  value,
  onChange,
  placeholder = "Choisir une date",
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
  const [datePart = "", timePart = ""] = value ? value.split("T") : []
  const selected = parseLocalDate(datePart)

  function commit(nextDatePart: string, nextTimePart: string) {
    onChange(`${nextDatePart}T${nextTimePart || "00:00"}`)
  }

  return (
    <div className={cn("flex min-w-0 gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "min-w-0 flex-1 justify-start overflow-hidden font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="shrink-0" />
            <span className="truncate">{selected ? formatLabel(selected) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            captionLayout="dropdown"
            onSelect={(date) => {
              if (!date) return
              commit(formatLocalDate(date), timePart)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <TimePicker
        value={timePart || "00:00"}
        disabled={disabled || !datePart}
        onChange={(t) => commit(datePart, t)}
        className="w-28 shrink-0"
      />
    </div>
  )
}

export { DatePicker, DateTimePicker }
