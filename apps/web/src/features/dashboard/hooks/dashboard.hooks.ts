import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useDashboardStats() {
  const usersQuery = useQuery({
    queryKey: ['iam', 'users', 'list', { limit: 1 }],
    queryFn: async () => {
      const res = await api.iam.users.list.get({
        query: { limit: 1, page: 1 },
      })
      if (res.error) throw res.error
      return res.data
    },
  })

  const rolesQuery = useQuery({
    queryKey: ['iam', 'roles', 'list', { limit: 1 }],
    queryFn: async () => {
      const res = await api.iam.roles.list.get({
        query: { limit: 1, page: 1 },
      })
      if (res.error) throw res.error
      return res.data
    },
  })

  const locationsQuery = useQuery({
    queryKey: ['locations', 'list', { limit: 1 }],
    queryFn: async () => {
      const res = await api.locations.list.get({
        query: { limit: 1, page: 1 },
      })
      if (res.error) throw res.error
      return res.data
    },
  })

  const activeLocationsQuery = useQuery({
    queryKey: ['locations', 'list', { limit: 1, isActive: true }],
    queryFn: async () => {
      const res = await api.locations.list.get({
        query: { limit: 1, page: 1, isActive: 'true' as any },
      })
      if (res.error) throw res.error
      return res.data
    },
  })

  return {
    totalUsers: usersQuery.data?.meta.total ?? 0,
    totalRoles: rolesQuery.data?.meta.total ?? 0,
    totalLocations: locationsQuery.data?.meta.total ?? 0,
    activeLocations: activeLocationsQuery.data?.meta.total ?? 0,
    isLoading:
      usersQuery.isLoading ||
      rolesQuery.isLoading ||
      locationsQuery.isLoading ||
      activeLocationsQuery.isLoading,
  }
}

export function useRecentUsers() {
  return useQuery({
    queryKey: ['iam', 'users', 'list', { limit: 5 }],
    queryFn: async () => {
      const res = await api.iam.users.list.get({
        query: { limit: 5, page: 1 },
      })
      if (res.error) throw res.error
      return res.data.data
    },
  })
}

export function useRecentLocations() {
  return useQuery({
    queryKey: ['locations', 'list', { limit: 5 }],
    queryFn: async () => {
      const res = await api.locations.list.get({
        query: { limit: 5, page: 1 },
      })
      if (res.error) throw res.error
      return res.data.data
    },
  })
}
