import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, RefreshCwIcon } from 'lucide-react'

import { TableToolbar } from '@/components/shared/table-toolbar'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { useLocationAssignment } from '../use-location-assignment.ts'

interface LocationAssignmentProps {
	materialId: number
	permissions: { canRead: boolean; canAssign: boolean; canUnassign: boolean }
}

export function LocationAssignment({ materialId, permissions }: LocationAssignmentProps) {
	if (!permissions.canRead) {
		return (
			<p className="py-4 text-sm text-muted-foreground">
				You need material and location read access to view location assignments.
			</p>
		)
	}

	return (
		<LocationAssignmentBody key={materialId} materialId={materialId} permissions={permissions} />
	)
}

function LocationAssignmentBody({ materialId, permissions }: LocationAssignmentProps) {
	const { canAssign, canUnassign } = permissions
	const workflow = useLocationAssignment(materialId, permissions)
	const { locationsQuery, assignmentsQuery } = workflow
	const locations = locationsQuery.data?.data ?? []
	const meta = locationsQuery.data?.meta
	const assignmentsKnown = assignmentsQuery.data !== undefined
	const refreshing = locationsQuery.isFetching || assignmentsQuery.isFetching || workflow.isBusy

	return (
		<div className="space-y-3 py-4">
			<p className="text-sm text-muted-foreground">
				{canAssign || canUnassign
					? 'Manage which active locations stock this material.'
					: 'View which active locations stock this material. You have read-only access.'}
			</p>
			<TableToolbar
				searchValue={workflow.search}
				onSearchChange={workflow.setSearch}
				searchPlaceholder="Search locations..."
				actions={
					<Button
						size="sm"
						variant="outline"
						disabled={refreshing}
						onClick={() => {
							void locationsQuery.refetch()
							void workflow.refreshAssignments()
						}}
					>
						{refreshing ? <Spinner /> : <RefreshCwIcon />}
						Refresh
					</Button>
				}
			/>

			{assignmentsQuery.isError ? (
				<div
					role="alert"
					className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<p>
						{assignmentsKnown
							? 'Could not refresh assignments. Showing the last loaded status; changes are disabled.'
							: 'Could not load assignments. Status is unavailable and changes are disabled.'}
					</p>
					<Button
						size="sm"
						variant="outline"
						disabled={workflow.isBusy || assignmentsQuery.isFetching}
						onClick={() => void workflow.refreshAssignments()}
					>
						Retry assignments
					</Button>
				</div>
			) : !assignmentsKnown ? (
				<div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner /> Loading assignments...
				</div>
			) : workflow.isUncertain ? (
				<p role="status" className="text-sm text-muted-foreground">
					The last change could not be confirmed. Retry that action or refresh assignments before
					making other changes.
				</p>
			) : undefined}

			{locationsQuery.isError && (
				<div
					role="alert"
					className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<p>
						{locationsQuery.data
							? 'Could not refresh locations. Showing the last loaded locations.'
							: 'Could not load locations. Try again or change your search.'}
					</p>
					<Button
						size="sm"
						variant="outline"
						disabled={locationsQuery.isFetching}
						onClick={() => void locationsQuery.refetch()}
					>
						Retry locations
					</Button>
				</div>
			)}

			{locationsQuery.isPending ? (
				<div
					role="status"
					className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
				>
					<Spinner /> Loading locations...
				</div>
			) : !locationsQuery.isError && locationsQuery.data && locations.length === 0 ? (
				<p className="py-6 text-sm text-muted-foreground">
					{workflow.search
						? 'No locations match your search. Try another name or code.'
						: 'No active locations available.'}
				</p>
			) : locations.length > 0 ? (
				<ul aria-label="Location assignments" className="divide-y rounded-md border">
					{locations.map((location) => {
						const assigned = workflow.assignedLocationIds.has(location.id)
						const canAct = assigned ? canUnassign : canAssign
						const failure = workflow.failedActions[location.id]
						const canRetry = failure && (failure.assigned ? canAssign : canUnassign)
						const pending = workflow.pendingLocationId === location.id
						return (
							<li key={location.id} className="space-y-2 px-3 py-2.5">
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0 flex-1 space-y-1 text-sm">
										<p className="wrap-anywhere font-medium">{location.name}</p>
										<p className="wrap-anywhere font-mono text-xs text-muted-foreground">
											{location.code}
										</p>
										<p className="flex items-center gap-1 text-xs text-muted-foreground">
											{assignmentsKnown && assigned && <CheckIcon className="size-3" />}
											{!assignmentsKnown
												? 'Status unavailable'
												: assigned
													? 'Assigned'
													: 'Not assigned'}
										</p>
									</div>
									{assignmentsKnown && canAct && !failure && (
										<Button
											size="sm"
											variant="outline"
											disabled={!workflow.canChange}
											aria-label={`${assigned ? 'Unassign' : 'Assign'} ${location.name}`}
											onClick={() =>
												void workflow.run({
													locationId: location.id,
													locationName: location.name,
													assigned: !assigned,
												})
											}
										>
											{pending && <Spinner />}
											{pending ? 'Saving...' : assigned ? 'Unassign' : 'Assign'}
										</Button>
									)}
								</div>
								{failure && (
									<div role="alert" className="space-y-2 text-sm text-destructive">
										<p className="wrap-anywhere">
											Could not {failure.assigned ? 'assign' : 'unassign'} {failure.locationName}.{' '}
											{failure.message}
										</p>
										{canRetry && (
											<Button
												size="sm"
												variant="outline"
												disabled={workflow.isBusy || assignmentsQuery.isFetching}
												aria-label={`Retry ${failure.assigned ? 'assigning' : 'unassigning'} ${failure.locationName}`}
												onClick={() => void workflow.run(failure, true)}
											>
												{pending && <Spinner />}
												{pending ? 'Retrying...' : 'Retry'}
											</Button>
										)}
									</div>
								)}
							</li>
						)
					})}
				</ul>
			) : undefined}

			<div className="flex flex-wrap items-center justify-between gap-2">
				<p aria-live="polite" className="text-xs text-muted-foreground">
					{meta ? (
						<>
							<span className="font-mono tabular-nums">{meta.total}</span> locations · Page{' '}
							<span className="font-mono tabular-nums">{workflow.page}</span> of{' '}
							<span className="font-mono tabular-nums">{Math.max(1, meta.totalPages)}</span>
						</>
					) : (
						`Page ${workflow.page}`
					)}
				</p>
				<div className="flex items-center gap-1">
					<Button
						size="sm"
						variant="outline"
						aria-label="Previous location page"
						disabled={workflow.page <= 1}
						onClick={() => workflow.setPage(workflow.page - 1)}
					>
						<ChevronLeftIcon /> Previous
					</Button>
					<Button
						size="sm"
						variant="outline"
						aria-label="Next location page"
						disabled={!meta || workflow.page >= meta.totalPages}
						onClick={() => workflow.setPage(workflow.page + 1)}
					>
						Next <ChevronRightIcon />
					</Button>
				</div>
			</div>
		</div>
	)
}
