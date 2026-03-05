import { createCallable } from 'react-call'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { Loader2Icon, MapPinIcon, SearchIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { materialLocationApi } from '../api'
import { locationApi } from '@/features/location'
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

interface MaterialAssignToLocationDialogProps {
  materialIds: Array<number>
  materialName: string
}

export const MaterialAssignToLocationDialog =
  createCallable<MaterialAssignToLocationDialogProps>(props => {
    const { call, materialIds, materialName } = props
    const queryClient = useQueryClient()

    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState<Array<number>>([])
    const debouncedSearch = useDebounce(search, 300)

    // 1. Fetch all available locations
    const { data: locationsData, isLoading: isLoadingLocations } = useQuery(
      locationApi.list.query({
        page: 1,
        limit: 100,
        search: debouncedSearch || undefined,
        isActive: true,
      })
    )

    // 2. Fetch already assigned locations for this material (only if single material)
    const { data: assignedLocations, isLoading: isLoadingAssigned } = useQuery({
      ...materialLocationApi.byMaterial.query({ id: materialIds[0] }),

      enabled: materialIds.length === 1,
    })

    const assignedIds = useMemo(() => {
      if (!assignedLocations?.data) return new Set<number>()
      return new Set(assignedLocations.data.map(l => l.locationId))
    }, [assignedLocations])

    const assignMutation = useMutation({
      mutationFn: materialLocationApi.assign.mutationFn,
      onSuccess: () => {
        // Invalidate material list and detail to update location counts
        queryClient.invalidateQueries({ queryKey: ['material'] })
      },
    })

    function toggleSelected(id: number) {
      if (assignedIds.has(id)) return // Already assigned
      setSelected(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      )
    }

    async function handleAssign() {
      if (selected.length === 0) return

      // Since the API takes one locationId at a time for batch materialIds,
      // and we have one materialId and batch locationIds,
      // we need to call assign for each location.
      const promises = selected.map(locId =>
        assignMutation.mutateAsync({
          body: {
            locationId: locId,
            materialIds,
          },
        })
      )

      const promise = Promise.all(promises)

      await toast.promise(promise, {
        loading: 'Menghubungkan ke lokasi...',
        success: `Berhasil assign ${materialName} ke ${selected.length} lokasi`,
        error: 'Gagal menghubungkan ke lokasi',
      })

      call.end()
    }

    const locations = locationsData?.data ?? []
    const isLoading = isLoadingLocations || isLoadingAssigned

    return (
      <Dialog open={!call.ended} onOpenChange={() => call.end()}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader className='border-b pb-4'>
            <DialogTitle>Assign ke Lokasi</DialogTitle>
            <DialogDescription>
              Pilih lokasi untuk menyimpan bahan baku{' '}
              <span className='font-medium text-foreground'>
                {materialName}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className='relative'>
            <SearchIcon className='absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground' />
            <Input
              placeholder='Cari lokasi...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='pl-8'
            />
          </div>

          {/* Location list */}
          <ScrollArea className='h-64 border rounded-md'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center h-full gap-2 text-muted-foreground'>
                <Loader2Icon className='size-5 animate-spin' />
                <span className='text-sm'>Memuat data...</span>
              </div>
            ) : locations.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full gap-2 text-muted-foreground p-6'>
                <MapPinIcon className='size-8 opacity-30' />
                <span className='text-sm'>Tidak ada lokasi ditemukan</span>
              </div>
            ) : (
              <div className='flex flex-col'>
                {locations.map(l => {
                  const isAssigned = assignedIds.has(l.id)
                  const isSelected = selected.includes(l.id) || isAssigned

                  return (
                    <button
                      key={l.id}
                      type='button'
                      disabled={isAssigned}
                      onClick={() => toggleSelected(l.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                        isAssigned
                          ? 'opacity-60 cursor-not-allowed bg-muted/20'
                          : ''
                      }`}
                    >
                      <Checkbox checked={isSelected} disabled={isAssigned} />
                      <div className='flex flex-col text-left'>
                        <span className='text-sm font-medium'>{l.name}</span>
                        <div className='flex items-center gap-2'>
                          <span className='text-[10px] px-1.5 py-0.5 rounded-full bg-muted border text-muted-foreground font-mono'>
                            {l.code}
                          </span>
                          {isAssigned && (
                            <span className='text-[10px] text-primary font-semibold uppercase'>
                              Terhubung
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
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
                ? 'Menghubungkan...'
                : `Simpan Perubahan (${selected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }, 200)
