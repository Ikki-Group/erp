import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { PlusIcon, ShieldCheckIcon, UserIcon } from 'lucide-react'
import { z } from 'zod'

import { PageHeader, PermissionGate } from '@/components/shared'
import { PageTabs } from '@/components/shared/page-tabs'
import type { PageTab } from '@/components/shared/page-tabs'

import { Button } from '@/components/ui/button'

import { roleResource, userResource } from '@/features/iam/api.ts'
import { RolesList } from '@/features/iam/components/roles-list.tsx'
import { UsersList } from '@/features/iam/components/users-list.tsx'

// Combine all search params for both tabs
const searchSchema = z.object({
	tab: z.enum(['users', 'roles']).default('users'),
	page: z.number().optional().default(1),
	pageSize: z.number().optional().default(10),
	q: z.string().optional(),
	// Users filters
	isActive: z.coerce.number().int().min(0).max(1).optional(),
	// Roles filters
	isSystem: z.coerce.number().int().min(0).max(1).optional(),
})

export const Route = createFileRoute('/_authenticated/settings/access-control')({
	validateSearch: searchSchema,
	component: AccessControlPage,
})

function AccessControlPage() {
	const navigate = useNavigate({ from: Route.fullPath })
	const search = Route.useSearch()
	const { tab } = search

	// Counts for the tab labels
	const usersQuery = useQuery(userResource.list.queryOptions({ page: 1, limit: 1 }))
	const rolesQuery = useQuery(roleResource.list.queryOptions({ page: 1, limit: 1 }))

	const totalUsers = usersQuery.data?.meta?.total
	const totalRoles = rolesQuery.data?.meta?.total

	const handleTabChange = (tabId: string) => {
		// Preserve common filters (search query) when switching tabs
		// Reset only tab-specific filters
		navigate({
			search: {
				tab: tabId as 'users' | 'roles',
				page: 1,
				pageSize: search.pageSize,
				q: search.q, // Preserve search across tabs
			},
			replace: true,
		})
	}

	const tabs: PageTab[] = useMemo(
		() => [
			{
				id: 'users',
				label: 'Users',
				icon: <UserIcon className="size-3.5" />,
				count: totalUsers,
			},
			{
				id: 'roles',
				label: 'Roles',
				icon: <ShieldCheckIcon className="size-3.5" />,
				count: totalRoles,
			},
		],
		[totalUsers, totalRoles],
	)

	return (
		<div className="space-y-6">
			<PageHeader
				title="Access Control"
				description="Manage users and roles for access control."
				actions={
					<PermissionGate permission="iam.create">
						{tab === 'users' ? (
							<Button size="sm" onClick={() => navigate({ to: '/settings/users/new' })}>
								<PlusIcon className="size-4" />
								Add User
							</Button>
						) : (
							<Button size="sm" onClick={() => navigate({ to: '/settings/roles/new' })}>
								<PlusIcon className="size-4" />
								Add Role
							</Button>
						)}
					</PermissionGate>
				}
			/>

			<PageTabs tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />

			{tab === 'users' && (
				<UsersList
					searchParams={{
						page: search.page,
						pageSize: search.pageSize,
						q: search.q,
						isActive: search.isActive,
					}}
				/>
			)}
			{tab === 'roles' && (
				<RolesList
					searchParams={{
						page: search.page,
						pageSize: search.pageSize,
						q: search.q,
						isSystem: search.isSystem,
					}}
				/>
			)}
		</div>
	)
}
