import {
  CheckIcon,
  ChevronsUpDownIcon,
  GalleryVerticalEndIcon,
  MapPinIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppState } from '@/hooks/use-app-state'
import { useUser } from '@/hooks/use-user'
import { Button } from '@/components/ui/button'

export function LocationSwitcher() {
  const { location, setLocation } = useAppState()
  const { assignments } = useUser()

  const mapLocations = useMemo(
    () => new Map(assignments.map(a => [a.location.id, a.location.name])),
    [assignments]
  )

  const hasAssignments = assignments.length > 0
  if (!hasAssignments || !location || location.length === 0) return null

  const hasConsolidated = assignments.length > 1
  const isConsolidated =
    hasConsolidated && location.length === mapLocations.size

  const label = isConsolidated
    ? 'Consolidated View'
    : (mapLocations.get(location[0]) ?? '-')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='outline' className='w-50 px-1' size='lg' />}
      >
        <div className='flex items-center gap-1 text-left'>
          <div className='flex size-6 items-center justify-center'>
            {!isConsolidated ? (
              <MapPinIcon className='size-3' />
            ) : (
              <GalleryVerticalEndIcon className='size-3' />
            )}
          </div>
          <div className='flex-1 grid text-left'>
            <span className='truncate'>{label}</span>
          </div>
        </div>
        <ChevronsUpDownIcon className='ml-auto size-4 opacity-50' />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-50 rounded-lg'
        align='start'
        sideOffset={4}
      >
        {hasConsolidated && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-xs text-muted-foreground'>
                Scope
              </DropdownMenuLabel>

              {/* Consolidated View Option */}
              {assignments.length > 1 && (
                <DropdownMenuItem
                  onClick={() =>
                    setLocation(assignments.map(a => a.location.id))
                  }
                  className='gap-2 p-2 text-xs'
                >
                  <div className='flex size-6 items-center justify-center rounded-sm border'>
                    <GalleryVerticalEndIcon className='size-4 shrink-0' />
                  </div>
                  Consolidated View
                  {isConsolidated && <CheckIcon className='ml-auto h-4 w-4' />}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuLabel className='text-xs text-muted-foreground'>
            Locations
          </DropdownMenuLabel>

          {assignments.map(({ location: userLocation }) => (
            <DropdownMenuItem
              key={userLocation.id}
              onClick={() => setLocation([userLocation.id])}
              className='gap-2 p-2 text-xs'
            >
              <div className='flex size-6 items-center justify-center rounded-sm border'>
                <span className='text-xs font-bold'>
                  {userLocation.name.charAt(0)}
                </span>
              </div>
              {userLocation.name}
              {!isConsolidated && userLocation.id === location[0] && (
                <CheckIcon className='ml-auto h-4 w-4' />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem className='gap-2 p-2 text-xs' disabled>
          <div className='flex size-6 items-center justify-center rounded-md border bg-background'>
            <PlusIcon className='size-4' />
          </div>
          <div className='font-medium text-muted-foreground'>Add Location</div>
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
