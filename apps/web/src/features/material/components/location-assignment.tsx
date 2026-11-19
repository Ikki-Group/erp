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
				Anda memerlukan akses baca bahan dan lokasi untuk melihat penugasan lokasi.
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
					? 'Kelola lokasi aktif yang menyimpan bahan ini.'
					: 'Lihat lokasi aktif yang menyimpan bahan ini. Anda hanya memiliki akses baca.'}
			</p>
			<TableToolbar
				searchValue={workflow.search}
				onSearchChange={workflow.setSearch}
				searchPlaceholder="Cari lokasi..."
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
						Muat ulang
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
							? 'Gagal memuat ulang penugasan. Menampilkan status terakhir yang dimuat; perubahan dinonaktifkan.'
							: 'Gagal memuat penugasan. Status tidak tersedia dan perubahan dinonaktifkan.'}
					</p>
					<Button
						size="sm"
						variant="outline"
						disabled={workflow.isBusy || assignmentsQuery.isFetching}
						onClick={() => void workflow.refreshAssignments()}
					>
						Coba lagi penugasan
					</Button>
				</div>
			) : !assignmentsKnown ? (
				<div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
					<Spinner /> Memuat penugasan...
				</div>
			) : workflow.isUncertain ? (
				<p role="status" className="text-sm text-muted-foreground">
					Perubahan terakhir tidak dapat dikonfirmasi. Coba lagi tindakan itu atau muat ulang
					penugasan sebelum melakukan perubahan lain.
				</p>
			) : undefined}

			{locationsQuery.isError && (
				<div
					role="alert"
					className="space-y-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
				>
					<p>
						{locationsQuery.data
							? 'Gagal memuat ulang lokasi. Menampilkan lokasi terakhir yang dimuat.'
							: 'Gagal memuat lokasi. Coba lagi atau ubah pencarian Anda.'}
					</p>
					<Button
						size="sm"
						variant="outline"
						disabled={locationsQuery.isFetching}
						onClick={() => void locationsQuery.refetch()}
					>
						Coba lagi lokasi
					</Button>
				</div>
			)}

			{locationsQuery.isPending ? (
				<div
					role="status"
					className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
				>
					<Spinner /> Memuat lokasi...
				</div>
			) : !locationsQuery.isError && locationsQuery.data && locations.length === 0 ? (
				<p className="py-6 text-sm text-muted-foreground">
					{workflow.search
						? 'Tidak ada lokasi yang cocok dengan pencarian Anda. Coba nama atau kode lain.'
						: 'Tidak ada lokasi aktif.'}
				</p>
			) : locations.length > 0 ? (
				<ul aria-label="Penugasan lokasi" className="divide-y rounded-md border">
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
												? 'Status tidak tersedia'
												: assigned
													? 'Ditugaskan'
													: 'Belum ditugaskan'}
										</p>
									</div>
									{assignmentsKnown && canAct && !failure && (
										<Button
											size="sm"
											variant="outline"
											disabled={!workflow.canChange}
											aria-label={`${assigned ? 'Lepas' : 'Tugaskan'} ${location.name}`}
											onClick={() =>
												void workflow.run({
													locationId: location.id,
													locationName: location.name,
													assigned: !assigned,
												})
											}
										>
											{pending && <Spinner />}
											{pending ? 'Menyimpan...' : assigned ? 'Lepas' : 'Tugaskan'}
										</Button>
									)}
								</div>
								{failure && (
									<div role="alert" className="space-y-2 text-sm text-destructive">
										<p className="wrap-anywhere">
											Gagal {failure.assigned ? 'menugaskan' : 'melepas'} {failure.locationName}.{' '}
											{failure.message}
										</p>
										{canRetry && (
											<Button
												size="sm"
												variant="outline"
												disabled={workflow.isBusy || assignmentsQuery.isFetching}
												aria-label={`Coba lagi ${failure.assigned ? 'menugaskan' : 'melepas'} ${failure.locationName}`}
												onClick={() => void workflow.run(failure, true)}
											>
												{pending && <Spinner />}
												{pending ? 'Mencoba lagi...' : 'Coba lagi'}
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
							<span className="font-mono tabular-nums">{meta.total}</span> lokasi · Halaman{' '}
							<span className="font-mono tabular-nums">{workflow.page}</span> dari{' '}
							<span className="font-mono tabular-nums">{Math.max(1, meta.totalPages)}</span>
						</>
					) : (
						`Halaman ${workflow.page}`
					)}
				</p>
				<div className="flex items-center gap-1">
					<Button
						size="sm"
						variant="outline"
						aria-label="Halaman lokasi sebelumnya"
						disabled={workflow.page <= 1}
						onClick={() => workflow.setPage(workflow.page - 1)}
					>
						<ChevronLeftIcon /> Sebelumnya
					</Button>
					<Button
						size="sm"
						variant="outline"
						aria-label="Halaman lokasi berikutnya"
						disabled={!meta || workflow.page >= meta.totalPages}
						onClick={() => workflow.setPage(workflow.page + 1)}
					>
						Berikutnya <ChevronRightIcon />
					</Button>
				</div>
			</div>
		</div>
	)
}
