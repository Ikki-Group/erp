import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'

import { ShieldCheckIcon, UserIcon } from 'lucide-react'

import { PageHeader, StatCard } from '@/components/shared'
import { PageTabs } from '@/components/shared/page-tabs'
import type { PageTab } from '@/components/shared/page-tabs'

import { roleResource, userResource } from '@/features/iam/api.ts'
import { UsersList } from '@/features/iam/components/users-list.tsx'
import { RolesList } from '@/features/iam/components/roles-list.tsx'

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

	// Stats for both tabs
	const usersQuery = useQuery(userResource.list.queryOptions({ page: 1, limit: 1 }))
	const rolesQuery = useQuery(roleResource.list.queryOptions({ page: 1, limit: 1 }))

	const totalUsers = usersQuery.data?.meta?.total ?? 0
	const totalRoles = rolesQuery.data?.meta?.total ?? 0

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

	const stats = useMemo(
		() => (
			<div className="grid gap-4 sm:grid-cols-2">
				<StatCard
					title="Users"
					value={totalUsers}
					icon={<UserIcon className="size-4" />}
					description="Total registered"
					isLoading={usersQuery.isLoading}
				/>
				<StatCard
					title="Roles"
					value={totalRoles}
					icon={<ShieldCheckIcon className="size-4" />}
					description="Access control"
					isLoading={rolesQuery.isLoading}
				/>
			</div>
		),
		[totalUsers, totalRoles, usersQuery.isLoading, rolesQuery.isLoading],
	)

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
			/>

			{stats}

			<PageTabs tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />

			{tab === 'users' && <UsersList searchParams={{
				page: search.page,
				pageSize: search.pageSize,
				q: search.q,
				isActive: search.isActive,
			}} />}
			{tab === 'roles' && <RolesList searchParams={{
				page: search.page,
				pageSize: search.pageSize,
				q: search.q,
				isSystem: search.isSystem,
			}} />}
		</div>
	)
}
