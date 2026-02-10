import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  GalleryVerticalEndIcon,
  MapPinIcon,
  PlusIcon,
} from 'lucide-react'
import { useLocationStore } from '../hooks/use-location-store'

export function LocationSwitcher() {
  const { locations, selectedLocationId, setSelectedLocation } =
    useLocationStore()

  // Find active location or fallback to "Consolidated" object
  const activeLocation = locations.find((l) => l.id === selectedLocationId) || {
    name: 'Consolidated View',
    description: 'All Locations',
    id: 'consolidated', // distinct ID for UI logic
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="w-[200px] px-1" size="lg" />
        }
      >
        <div className="flex items-center gap-1 text-left">
          <div className="flex size-6 items-center justify-center">
            {selectedLocationId ? (
              <MapPinIcon className="size-3" />
            ) : (
              <GalleryVerticalEndIcon className="size-3" />
            )}
          </div>
          <div className="flex-1 grid text-left">
            <span className="truncate">{activeLocation.name}</span>
          </div>
        </div>
        <ChevronsUpDownIcon className="ml-auto size-4 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[200px] rounded-lg"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Scope
          </DropdownMenuLabel>

          {/* Consolidated View Option */}
          <DropdownMenuItem
            onClick={() => setSelectedLocation(null)}
            className="gap-2 p-2 text-xs"
          >
            <div className="flex size-6 items-center justify-center rounded-sm border">
              <GalleryVerticalEndIcon className="size-4 shrink-0" />
            </div>
            Consolidated View
            {selectedLocationId === null && (
              <CheckIcon className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Locations
          </DropdownMenuLabel>

          {locations.map((loc) => (
            <DropdownMenuItem
              key={loc.id}
              onClick={() => setSelectedLocation(loc.id)}
              className="gap-2 p-2 text-xs"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <span className="text-xs font-bold">{loc.name.charAt(0)}</span>
              </div>
              {loc.name}
              {selectedLocationId === loc.id && (
                <CheckIcon className="ml-auto h-4 w-4" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 p-2 text-xs" disabled>
          <div className="flex size-6 items-center justify-center rounded-md border bg-background">
            <PlusIcon className="size-4" />
          </div>
          <div className="font-medium text-muted-foreground">Add Location</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
