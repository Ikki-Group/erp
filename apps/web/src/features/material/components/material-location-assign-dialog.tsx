import { createCallable } from 'react-call'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { Loader2Icon, PackageIcon, SearchIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { materialApi, materialLocationApi } from '../api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toastLabelMessage } from '@/lib/toast-message'

interface MaterialLocationAssignDialogProps {
  locationId: string
  locationName: string
}

export const MaterialLocationAssignDialog =
  createCallable<MaterialLocationAssignDialogProps>(props => {
    const { call, locationId, locationName } = props
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Array<string>>([])
    const debouncedSearch = useDebounce(search, 300)

    const { data, isLoading } = useQuery(
      materialApi.list.query({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
      })
    )

    const assignMutation = useMutation({
      mutationFn: materialLocationApi.assign.mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: materialLocationApi.stock.queryKey(undefined),
        })
      },
    })

    function toggleSelected(id: string) {
      setSelected(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      )
    }

    function toggleAll() {
      if (!data?.data) return
      const allIds = data.data.map(m => m.id)
      const allSelected = allIds.every(id => selected.includes(id))
      setSelected(prev => {
        if (allSelected) {
          return prev.filter(id => !allIds.includes(id))
        }
        return [...new Set([...prev, ...allIds])]
      })
    }

    async function handleAssign() {
      if (selected.length === 0) return

      const promise = assignMutation.mutateAsync({
        body: {
          locationId,
          materialIds: selected,
        },
      })

      await toast
        .promise(promise, toastLabelMessage('create', 'assign material'))
        .unwrap()

      call.end()
    }

    const materials = data?.data ?? []
    const allVisibleSelected =
      materials.length > 0 && materials.every(m => selected.includes(m.id))

    return (
      <Dialog open={!call.ended} onOpenChange={() => call.end()}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='border-b pb-4'>
            <DialogTitle>Assign Bahan Baku</DialogTitle>
            <DialogDescription>
              Pilih bahan baku yang ingin di-assign ke{' '}
              <span className='font-medium text-foreground'>
                {locationName}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className='relative'>
            <SearchIcon className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <Input
              placeholder='Cari bahan baku...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='pl-8'
            />
          </div>

          {/* Material list */}
          <ScrollArea className='h-64 border rounded-md'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center h-full gap-2 text-muted-foreground'>
                <Loader2Icon className='size-5 animate-spin' />
                <span className='text-sm'>Memuat data...</span>
              </div>
            ) : materials.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-6'>
                <PackageIcon className='size-8 opacity-30' />
                <span className='text-sm'>Tidak ada bahan baku ditemukan</span>
              </div>
            ) : (
              <div className='flex flex-col'>
                {/* Select all */}
                <button
                  type='button'
                  onClick={toggleAll}
                  className='flex items-center gap-3 px-3 py-2 border-b bg-muted/50 hover:bg-muted transition-colors sticky top-0'
                >
                  <Checkbox checked={allVisibleSelected} />
                  <span className='text-sm font-medium'>Pilih Semua</span>
                </button>

                {materials.map(m => (
                  <button
                    key={m.id}
                    type='button'
                    onClick={() => toggleSelected(m.id)}
                    className='flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-b-0'
                  >
                    <Checkbox checked={selected.includes(m.id)} />
                    <div className='flex flex-col text-left'>
                      <span className='text-sm font-medium'>{m.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        SKU: {m.sku}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant='outline' type='button' onClick={() => call.end()}>
              Batal
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selected.length === 0 || assignMutation.isPending}
            >
              {assignMutation.isPending
                ? 'Menyimpan...'
                : `Assign (${selected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }, 200)
