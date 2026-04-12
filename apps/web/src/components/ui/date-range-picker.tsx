'use client'

import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface DatePickerBaseProps {
  /** Placeholder text when no date is selected */
  placeholder?: string
  /** Date format string (date-fns compatible) */
  dateFormat?: string
  /** Disabled state */
  disabled?: boolean
  /** Additional className for the trigger button */
  className?: string
  /** Locale for date formatting */
  locale?: typeof idLocale
}

interface DatePickerSingleProps extends DatePickerBaseProps {
  mode: 'single'
  value?: Date
  onValueChange?: (date: Date | undefined) => void
}

interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: 'range'
  value?: DateRange
  onValueChange?: (range: DateRange | undefined) => void
}

type DateRangePickerProps = DatePickerSingleProps | DatePickerRangeProps

/* -------------------------------------------------------------------------- */
/*  Trigger Button                                                             */
/* -------------------------------------------------------------------------- */

function DatePickerTrigger({
  className,
  disabled,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <Button
      data-slot="date-picker-trigger"
      variant="outline"
      disabled={disabled}
      className={cn(
        'w-full justify-start text-left font-normal',
        !children && 'text-muted-foreground',
        className,
      )}
      {...props}
    >
      <CalendarIcon data-icon="inline-start" />
      {children}
    </Button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Display Value                                                              */
/* -------------------------------------------------------------------------- */

function formatDisplayValue(
  props: DateRangePickerProps,
): string | undefined {
  const dateFormat = props.dateFormat ?? 'dd MMM yyyy'
  const locale = props.locale ?? idLocale

  if (props.mode === 'single') {
    if (!props.value) return undefined
    return format(props.value, dateFormat, { locale })
  }

  if (!props.value?.from) return undefined

  if (props.value.to) {
    return `${format(props.value.from, dateFormat, { locale })} – ${format(props.value.to, dateFormat, { locale })}`
  }

  return format(props.value.from, dateFormat, { locale })
}

/* -------------------------------------------------------------------------- */
/*  Desktop: Popover                                                           */
/* -------------------------------------------------------------------------- */

function DatePickerDesktop(props: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const displayValue = formatDisplayValue(props)
  const placeholder = props.placeholder ?? (props.mode === 'range' ? 'Pilih rentang tanggal' : 'Pilih tanggal')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <DatePickerTrigger
            className={props.className}
            disabled={props.disabled}
          />
        }
      >
        {displayValue ?? <span className="text-muted-foreground">{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        {props.mode === 'single' ? (
          <Calendar
            mode="single"
            selected={props.value}
            onSelect={(date) => {
              props.onValueChange?.(date)
              setOpen(false)
            }}
            numberOfMonths={1}
            locale={props.locale ?? idLocale}
          />
        ) : (
          <Calendar
            mode="range"
            selected={props.value}
            onSelect={(range) => {
              props.onValueChange?.(range)
              // Close when range is complete
              if (range?.from && range?.to) {
                setOpen(false)
              }
            }}
            numberOfMonths={2}
            locale={props.locale ?? idLocale}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

/* -------------------------------------------------------------------------- */
/*  Mobile: Drawer                                                             */
/* -------------------------------------------------------------------------- */

function DatePickerMobile(props: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const displayValue = formatDisplayValue(props)
  const placeholder = props.placeholder ?? (props.mode === 'range' ? 'Pilih rentang tanggal' : 'Pilih tanggal')
  const title = props.mode === 'range' ? 'Pilih Rentang Tanggal' : 'Pilih Tanggal'

  // Staging state — changes are not committed until the user confirms
  const [stageSingle, setStageSingle] = React.useState<Date | undefined>(
    props.mode === 'single' ? props.value : undefined,
  )
  const [stageRange, setStageRange] = React.useState<DateRange | undefined>(
    props.mode === 'range' ? props.value : undefined,
  )

  // Sync staging state when drawer opens
  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        if (props.mode === 'single') {
          setStageSingle(props.value)
        } else {
          setStageRange(props.value)
        }
      }
      setOpen(nextOpen)
    },
    [props.mode, props.value],
  )

  const handleConfirm = React.useCallback(() => {
    if (props.mode === 'single') {
      props.onValueChange?.(stageSingle)
    } else {
      props.onValueChange?.(stageRange)
    }
    setOpen(false)
  }, [props, stageSingle, stageRange])

  const hasSelection = props.mode === 'single'
    ? !!stageSingle
    : !!stageRange?.from

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DatePickerTrigger
        className={props.className}
        disabled={props.disabled}
        onClick={() => setOpen(true)}
      >
        {displayValue ?? <span className="text-muted-foreground">{placeholder}</span>}
      </DatePickerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{placeholder}</DrawerDescription>
        </DrawerHeader>
        <div className="flex justify-center overflow-auto px-4 pb-2">
          {props.mode === 'single' ? (
            <Calendar
              mode="single"
              selected={stageSingle}
              onSelect={setStageSingle}
              numberOfMonths={1}
              locale={props.locale ?? idLocale}
            />
          ) : (
            <Calendar
              mode="range"
              selected={stageRange}
              onSelect={setStageRange}
              numberOfMonths={1}
              locale={props.locale ?? idLocale}
            />
          )}
        </div>
        <DrawerFooter className="flex-row gap-2">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Batal
            </Button>
          </DrawerClose>
          <Button
            className="flex-1"
            disabled={!hasSelection}
            onClick={handleConfirm}
          >
            Simpan
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

/* -------------------------------------------------------------------------- */
/*  DateRangePicker — Responsive Root                                          */
/* -------------------------------------------------------------------------- */

function DateRangePicker(props: DateRangePickerProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <DatePickerMobile {...props} />
  }

  return <DatePickerDesktop {...props} />
}

export { DateRangePicker }
export type { DateRangePickerProps, DatePickerSingleProps, DatePickerRangeProps }
