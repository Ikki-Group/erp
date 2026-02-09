import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Plus, Mail, User, Shield, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/common/templates/DataTable'
import {
  useUsers,
  useUpdateUser,
  useDeleteUser,
} from '@/features/iam/hooks/iam.hooks'
import { useMemo } from 'react'

export const Route = createFileRoute('/_auth/iam/users/')({
  component: UsersListPage,
})

type UserType = {
  id: number
  username: string
  email: string
  fullname: string
  isActive: boolean
  isRoot: boolean
  createdAt: Date
  updatedAt: Date
}

const columnHelper = createColumnHelper<UserType>()

function UsersListPage() {
  const { data: usersData, isLoading } = useUsers({
    limit: 100, // TODO: Proper pagination support in DataTable
  })
  const updateUserMutation = useUpdateUser()
  const deleteUserMutation = useDeleteUser()

  const columns = useMemo<ColumnDef<UserType, any>[]>(
    () => [
      columnHelper.accessor('username', {
        header: 'Username',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4" />
            </div>
            <span className="font-medium">{info.getValue()}</span>
          </div>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('fullname', {
        header: 'Full Name',
      }),
      columnHelper.accessor('isRoot', {
        header: 'Role',
        cell: (info) =>
          info.getValue() ? (
            <Badge variant="default" className="gap-1">
              <Shield className="h-3 w-3" /> Root
            </Badge>
          ) : (
            <Badge variant="outline">User</Badge>
          ),
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'outline' : 'destructive'}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => {
          const user = info.row.original
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(user.username)}
                >
                  Copy username
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>View details</DropdownMenuItem>
                <DropdownMenuItem>Edit user</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    updateUserMutation.mutate({
                      id: user.id,
                      isActive: !user.isActive,
                    })
                  }
                >
                  {user.isActive ? 'Deactivate' : 'Activate'}
                </DropdownMenuItem>
                {!user.isRoot && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (
                          confirm('Are you sure you want to delete this user?')
                        ) {
                          deleteUserMutation.mutate(user.id)
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      }),
    ],
    [updateUserMutation, deleteUserMutation],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={usersData?.data || []}
        isLoading={isLoading}
      />
    </div>
  )
}
