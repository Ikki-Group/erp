import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Location } from '../types'

const MOCK_LOCATIONS: Location[] = [
  { id: '1', name: 'HO Jakarta', description: 'Central Headquarters' },
  { id: '2', name: 'Gudang Cikarang', description: 'Main Warehouse' },
  { id: '3', name: 'Toko Surabaya', description: 'Retail Store' },
]

interface LocationState {
  locations: Location[] // In real app, this would be populated from user.locations on login
  selectedLocationId: string | null
  setSelectedLocation: (id: string | null) => void
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      locations: MOCK_LOCATIONS,
      selectedLocationId: null, // Default to Consolidated view
      setSelectedLocation: (id) => set({ selectedLocationId: id }),
    }),
    {
      name: 'location-storage',
    },
  ),
)
