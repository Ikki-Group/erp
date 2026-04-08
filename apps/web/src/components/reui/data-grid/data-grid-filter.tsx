import { useDebounce } from '@uidotdev/usehooks'
import { SearchIcon, XIcon } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DataTableState } from '@/hooks/use-data-table-state'
import { cn } from '@/lib/utils'
import type { Option, StringOrNumber } from '@/types/common'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface FilterSearch {
  type: 'search'
  placeholder?: string
}

export interface FilterSelect<TFilter extends Record<string, any>> {
  type: 'select'
  /** Key in ds.filters object */
  key: keyof TFilter
  options: Array<Option<StringOrNumber>>
  placeholder?: string
}

export type FilterOptions<TFilter extends Record<string, any>> = FilterSearch | FilterSelect<TFilter>

interface DataGridFilterProps<TFilter extends Record<string, any>> {
  options: Array<FilterOptions<TFilter>>
  ds: DataTableState<TFilter>
  className?: string
}

/* -------------------------------------------------------------------------- */
/*  Main Component: DataGridFilter                                            */
/* -------------------------------------------------------------------------- */

/**
 * DataGridFilter — Automates filter UI based on DataTableState.
 *
 * @example
 * ```tsx
 * <DataGridFilter
 *   ds={ds}
 *   options={[
 *     { type: 'search', placeholder: 'Cari user...' },
 *     { type: 'select', key: 'role', options: roleOptions }
 *   ]}
 * />
 * ```
 */
export function DataGridFilter<TFilter extends Record<string, any>>({
  options,
  ds,
  className,
}: DataGridFilterProps<TFilter>) {
  const hasActiveFilters =
    ds.search.length > 0 || Object.values(ds.filters).some((v) => v !== undefined && v !== null && v !== '')

  const handleReset = () => {
    ds.setSearch('')
    ds.setFilters({} as TFilter)
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {options.map((option, index) => {
        switch (option.type) {
          case 'search':
            return (
              <DataGridFilterSearch
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`search-${index}`}
                value={ds.search}
                onChange={ds.setSearch}
                placeholder={option.placeholder}
              />
            )
          case 'select':
            return (
              <DataGridFilterSelect
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`select-${String(option.key)}-${index}`}
                value={ds.filters[option.key]}
                onChange={(val) => {
                  ds.setFilters((prev) => ({ ...prev, [option.key]: val }))
                }}
                options={option.options}
                placeholder={option.placeholder}
              />
            )
          default:
            return null
        }
      })}

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2 lg:px-3">
          Reset
          <XIcon className="ml-2 size-4" />
        </Button>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

/** Debounced search input */
interface DataGridFilterSearchProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

function DataGridFilterSearch({ value, onChange, placeholder = 'Cari...' }: DataGridFilterSearchProps) {
  const [internalValue, setInternalValue] = React.useState(value)
  const prevValueRef = React.useRef(value)

  // Sync internal state when external value changes (e.g. reset)
  if (value !== prevValueRef.current) {
    setInternalValue(value)
    prevValueRef.current = value
  }

  const debouncedValue = useDebounce(internalValue, 400)

  // Call onChange only when debounced value changes
  React.useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        value={internalValue}
        onChange={(e) => {
          setInternalValue(e.target.value)
        }}
        placeholder={placeholder}
        className="h-8 w-[180px] pl-8 lg:w-[250px]"
      />
    </div>
  )
}

/** Simple select filter */
interface DataGridFilterSelectProps {
  value: any
  onChange: (val: any) => void
  options: Array<Option<StringOrNumber>>
  placeholder?: string
}

function DataGridFilterSelect({ value, onChange, options, placeholder = 'Filter...' }: DataGridFilterSelectProps) {
  return (
    <Select
      items={options}
      value={value != null && value !== '' ? String(value) : ''}
      onValueChange={(val) => {
        if (val === '') {
          onChange()
          return
        }

        // Boolean recovery
        if (val === 'true') {
          onChange(true)
          return
        }
        if (val === 'false') {
          onChange(false)
          return
        }

        // Numeric recovery
        const numVal = Number(val)
        onChange(Number.isNaN(numVal) ? val : numVal)
      }}
    >
      <SelectTrigger className="h-8 w-fit min-w-[130px] gap-2">
        <SelectValue placeholder={placeholder}>
          {value != null && value !== ''
            ? options.find((opt) => String(opt.value) === String(value))?.label
            : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
