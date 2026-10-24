import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { ShieldCheckIcon, UserIcon } from 'lucide-react'
import { z } from 'zod'

import { listSearchSchema } from '@/components/data-table'
import { PageHeader, StatCard } from '@/components/shared'
import { PageTabs } from '@/components/shared/page-tabs'
import type { PageTab } from '@/components/shared/page-tabs'

import { Button } from '@/components/ui/button'

import { roleResource, userResource } from '@/features/iam/api.ts'
import { RolesList } from '@/features/iam/components/roles-list.tsx'
import { UsersList } from '@/features/iam/components/users-list.tsx'

// Combine all search params for both tabs
const searchSchema = listSearchSchema.extend({
	tab: z.enum(['users', 'roles']).default('users'),
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
	const usersQuery = useQuery({
		...userResource.list.queryOptions({ page: 1, limit: 1 }),
		throwOnError: false,
	})
	const rolesQuery = useQuery({
		...roleResource.list.queryOptions({ page: 1, limit: 1 }),
		throwOnError: false,
	})

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
				sort: search.sort,
			},
			replace: true,
		})
	}

	const stats = useMemo(
		() => (
			<div className="grid gap-4 sm:grid-cols-2">
				<StatCard
					title="Users"
					value={usersQuery.isError && !usersQuery.data ? '—' : totalUsers}
					icon={<UserIcon className="size-4" />}
					description="Total registered"
					isLoading={usersQuery.isLoading}
				/>
				<StatCard
					title="Roles"
					value={rolesQuery.isError && !rolesQuery.data ? '—' : totalRoles}
					icon={<ShieldCheckIcon className="size-4" />}
					description="Access control"
					isLoading={rolesQuery.isLoading}
				/>
			</div>
		),
		[
			totalUsers,
			totalRoles,
			usersQuery.isLoading,
			rolesQuery.isLoading,
			usersQuery.isError,
			rolesQuery.isError,
			usersQuery.data,
			rolesQuery.data,
		],
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
			<PageHeader title="Access Control" description="Manage users and roles for access control." />

			{stats}
			{(usersQuery.isError || rolesQuery.isError) && (
				<div
					role="alert"
					className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 p-3 text-sm"
				>
					<p>Could not refresh access-control totals.</p>
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							void usersQuery.refetch()
							void rolesQuery.refetch()
						}}
					>
						Retry totals
					</Button>
				</div>
			)}

			<PageTabs tabs={tabs} activeTab={tab} onTabChange={handleTabChange} />

			{tab === 'users' && <UsersList searchParams={search} />}
			{tab === 'roles' && <RolesList searchParams={search} />}
		</div>
	)
}
