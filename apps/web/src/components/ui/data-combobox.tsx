import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { DatabaseIcon, Loader2Icon } from 'lucide-react'
import { Combobox } from '@/components/ui/combobox'

export interface DataComboboxProps<TItem> {
  value?: string | null
  onValueChange?: (value: string | null) => void
  placeholder?: string
  emptyText?: string
  loadingText?: string
  queryKey: Array<string>
  queryFn: (search: string) => Promise<Array<TItem>>
  getLabel: (item: TItem) => string
  getValue: (item: TItem) => string
  debounceMs?: number
  disabled?: boolean
  className?: string
}

export function DataCombobox<TItem>({
  value,
  onValueChange,
  placeholder = 'Pilih data...',
  emptyText = 'Data tidak ditemukan.',
  loadingText = 'Mencari data...',
  queryKey,
  queryFn,
  getLabel,
  getValue,
  debounceMs = 500,
  disabled = false,
  className,
}: DataComboboxProps<TItem>) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const debouncedSearch = useDebounce(inputValue, debounceMs)

  // Use selected item's label if the popup is closed and we have a selectedItem
  // Base UI Combobox manages uncontrolled inputValue automatically,
  // but we can let it be uncontrolled and simply hook into onInputValueChange if possible.
  // Wait, if we use `inputValue` and `onInputValueChange`, it handles the text in the input.
  // Instead of fully controlling it, we let Base UI coordinate it and just watch the `inputValue` state.

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKey, debouncedSearch],
    queryFn: () => queryFn(debouncedSearch),
    enabled: open,
  })

  return (
    <Combobox
      value={value ?? null}
      onValueChange={val => {
        onValueChange?.(val)
      }}
      open={open}
      onOpenChange={setOpen}
      inputValue={inputValue}
      onInputValueChange={setInputValue}
      disabled={disabled}
      items={data}
    >
      <div className='relative group/combobox-wrapper'>
        <Combobox.Input
          placeholder={placeholder}
          className={className}
          showClear={!!value}
        />
        {/* If we have a selected value but the input is empty or disconnected, 
            Base UI Combobox handles displaying the selected value's label mostly.
            But we must ensure the items provide labels. */}
      </div>

      <Combobox.Content
        align='start'
        className='w-[--anchor-width] p-0 shadow-lg'
      >
        <div className='flex flex-col'>
          {isLoading || isFetching ? (
            <div className='flex flex-col items-center justify-center p-6 text-muted-foreground gap-3'>
              <Loader2Icon className='size-5 animate-spin text-primary/60' />
              <span className='text-sm font-medium'>{loadingText}</span>
            </div>
          ) : (
            <Combobox.List className='p-1'>
              {data?.length === 0 ? (
                <div className='flex flex-col items-center justify-center p-6 text-muted-foreground gap-3 text-center'>
                  <DatabaseIcon className='size-8 opacity-20' />
                  <div className='flex flex-col gap-1'>
                    <span className='text-sm font-medium text-foreground'>
                      {emptyText}
                    </span>
                    <span className='text-xs'>
                      Ubah kata kunci pencarian Anda
                    </span>
                  </div>
                </div>
              ) : (
                data?.map(item => (
                  <Combobox.Item key={getValue(item)} value={getValue(item)}>
                    {getLabel(item)}
                  </Combobox.Item>
                ))
              )}
            </Combobox.List>
          )}
        </div>
      </Combobox.Content>
    </Combobox>
  )
}
