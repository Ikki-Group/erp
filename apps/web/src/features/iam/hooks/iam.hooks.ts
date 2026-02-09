import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// Users Hooks

export function useUsers(params: {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}) {
  return useQuery({
    queryKey: ['iam', 'users', 'list', params],
    queryFn: async () => {
      const res = await api.iam.users.list.get({
        query: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search,
          isActive:
            params.isActive !== undefined
              ? (String(params.isActive) as any)
              : undefined,
        },
      })
      if (res.error) throw res.error
      return res.data
    },
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['iam', 'users', 'detail', id],
    queryFn: async () => {
      const res = await api.iam.users.detail.get({
        query: { id },
      })
      if (res.error) throw res.error
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      // The SDK types should enforce data structure
      const res = await api.iam.users.create.post(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['iam', 'users'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create user')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.iam.users.update.put(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['iam', 'users', 'list'] })
      queryClient.invalidateQueries({
        queryKey: ['iam', 'users', 'detail', data.data.id],
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update user')
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.iam.users.delete.delete({
        id,
      })
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['iam', 'users', 'list'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete user')
    },
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.iam.users['toggle-active'].patch({
        id,
      })
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      toast.success(
        `User ${data.data.isActive ? 'activated' : 'deactivated'} successfully`,
      )
      queryClient.invalidateQueries({ queryKey: ['iam', 'users', 'list'] })
      queryClient.invalidateQueries({
        queryKey: ['iam', 'users', 'detail', data.data.id],
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to toggle user status')
    },
  })
}

// Roles Hooks

export function useRoles(params: {
  page?: number
  limit?: number
  search?: string
  isSystem?: boolean
}) {
  return useQuery({
    queryKey: ['iam', 'roles', 'list', params],
    queryFn: async () => {
      const res = await api.iam.roles.list.get({
        query: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search,
          isSystem:
            params.isSystem !== undefined
              ? (String(params.isSystem) as any)
              : undefined,
        },
      })
      if (res.error) throw res.error
      return res.data
    },
  })
}

export function useRole(id: number) {
  return useQuery({
    queryKey: ['iam', 'roles', 'detail', id],
    queryFn: async () => {
      const res = await api.iam.roles.detail.get({
        query: { id },
      })
      if (res.error) throw res.error
      return res.data
    },
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.iam.roles.create.post(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      toast.success('Role created successfully')
      queryClient.invalidateQueries({ queryKey: ['iam', 'roles'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create role')
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.iam.roles.update.put(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['iam', 'roles'] })
      queryClient.invalidateQueries({
        queryKey: ['iam', 'roles', 'detail', data.data.id],
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update role')
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.iam.roles.delete.delete({ id })
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: () => {
      toast.success('Role deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['iam', 'roles'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete role')
    },
  })
}

// Assignment Hooks

export function useUserAccess(userId: number) {
  return useQuery({
    queryKey: ['iam', 'users', 'access', userId],
    queryFn: async () => {
      const res = await api.iam.users.access.get({
        query: { id: userId },
      })
      if (res.error) throw res.error
      return res.data
    },
    enabled: !!userId,
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.iam['user-role-assignments'].assign.post(data)
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (_, variables) => {
      toast.success('Role assigned successfully')
      queryClient.invalidateQueries({
        queryKey: ['iam', 'users', 'access', variables.userId],
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to assign role')
    },
  })
}

export function useRevokeRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { id: number; userId: number }) => {
      const res = await api.iam['user-role-assignments'].revoke.delete({
        id: data.id,
      })
      if (res.error) throw res.error
      return res.data
    },
    onSuccess: (_, variables) => {
      toast.success('Role revoked successfully')
      queryClient.invalidateQueries({
        queryKey: ['iam', 'users', 'access', variables.userId],
      })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to revoke role')
    },
  })
}
