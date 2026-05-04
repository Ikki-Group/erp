import { useCallback, useMemo, useState } from 'react'

import { useMutation, useQuery } from '@tanstack/react-query'
import { createColumnHelper } from '@tanstack/react-table'

import { ClockIcon, LogInIcon, LogOutIcon, SearchIcon, TimerIcon } from 'lucide-react'
import { toast } from 'sonner'

import { useDataTable } from '@/hooks/use-data-table'
import { useDataTableState } from '@/hooks/use-data-table-state'

import { DataTableCard } from '@/components/blocks/card/data-table-card'
import { BadgeDot } from '@/components/blocks/data-display/badge-dot'
import { Page } from '@/components/layout/page'
import { CellDate, CellMenu, type CellMenuItem } from '@/components/reui/data-grid/data-grid-cell'
import { customColumn, textColumn } from '@/components/reui/data-grid/data-grid-columns'
import { DataGridFilter } from '@/components/reui/data-grid/data-grid-filter'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { locationApi } from '@/features/location'

import { employeeApi } from '../api'
import { hrApi } from '../api'
import type { AttendanceSelectDto, AttendanceStatus } from '../dto'

function statusBadge(status: AttendanceStatus) {
	switch (status) {
		case 'present':
			return <BadgeDot variant="success">Hadir</BadgeDot>
		case 'absent':
			return <BadgeDot variant="destructive">Absen</BadgeDot>
		case 'late':
			return <BadgeDot variant="warning">Terlambat</BadgeDot>
		case 'on_leave':
			return <BadgeDot variant="primary-outline">Izin</BadgeDot>
	}
}

function formatClockTime(date: Date | null | undefined) {
	if (!date) return '-'
	return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

const ch = createColumnHelper<AttendanceSelectDto>()

const columns = [
	ch.accessor(
		'date',
		customColumn({
			header: 'Tanggal',
			cell: (value) => <CellDate value={value} />,
			size: 130,
		}),
	),
	ch.accessor(
		'employeeName',
		customColumn({
			header: 'Karyawan',
			cell: (value, row) => (
				<div className="flex flex-col gap-0.5">
					<span className="font-medium">{value}</span>
					<span className="text-xs text-muted-foreground font-mono">{row.employeeCode}</span>
				</div>
			),
			size: 200,
		}),
	),
	ch.accessor(
		'status',
		customColumn({
			header: 'Status',
			cell: (value) => statusBadge(value as AttendanceStatus),
			size: 120,
		}),
	),
	ch.accessor(
		'clockIn',
		customColumn({
			header: 'Clock In',
			cell: (value) => <span className="font-mono text-sm">{formatClockTime(value)}</span>,
			size: 110,
		}),
	),
	ch.accessor(
		'clockOut',
		customColumn({
			header: 'Clock Out',
			cell: (value) => <span className="font-mono text-sm">{formatClockTime(value)}</span>,
			size: 110,
		}),
	),
	ch.accessor('shiftName', textColumn({ header: 'Shift', size: 140 })),
	ch.accessor('locationName', textColumn({ header: 'Lokasi', size: 160 })),
]

export function AttendancePage() {
	const [search, setSearch] = useState('')
	const [dateFrom, setDateFrom] = useState(() => {
		const d = new Date()
		d.setDate(d.getDate() - 7)
		return d.toISOString().split('T')[0]
	})
	const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0])

	const ds = useDataTableState()
	const { data, isLoading, refetch } = useQuery(
		hrApi.attendances.query({
			...ds.pagination,
			q: search,
			dateFrom: dateFrom ? new Date(dateFrom) : undefined,
			dateTo: dateTo ? new Date(dateTo) : undefined,
		}),
	)

	const { data: employeesData } = useQuery(employeeApi.list.query({ limit: 100 }))
	const { data: locationsData } = useQuery(locationApi.list.query({ limit: 100 }))

	const employees = employeesData?.data ?? []
	const locations = locationsData?.data ?? []

	const clockInMutation = useMutation({
		mutationFn: hrApi.clockIn.mutationFn,
		onSuccess: () => {
			toast.success('Clock-in berhasil')
			refetch()
		},
	})
	const clockOutMutation = useMutation({
		mutationFn: hrApi.clockOut.mutationFn,
		onSuccess: () => {
			toast.success('Clock-out berhasil')
			refetch()
		},
	})

	const handleClockOut = useCallback(
		async (row: AttendanceSelectDto) => {
			await clockOutMutation.mutateAsync({ body: { id: row.id, note: '' } })
		},
		[clockOutMutation],
	)

	const tableColumns = useMemo(() => {
		const actionColumn = ch.display({
			id: 'actions',
			header: 'Aksi',
			size: 100,
			enableSorting: false,
			cell: ({ row }) => {
				const items: CellMenuItem[] = []
				if (row.original.clockIn && !row.original.clockOut) {
					items.push({
						type: 'button',
						label: 'Clock Out',
						onClick: () => handleClockOut(row.original),
					})
				}
				if (items.length === 0) return null
				return <CellMenu items={items} label={`Aksi ${row.original.employeeName}`} />
			},
		})
		return [...columns, actionColumn]
	}, [handleClockOut])

	const table = useDataTable({
		columns: tableColumns,
		data: data?.data ?? [],
		pageCount: data?.meta?.totalPages ?? 1,
		rowCount: data?.meta?.total ?? 0,
		ds,
	})

	const today = new Date().toISOString().split('T')[0]

	return (
		<Page size="xl">
			<Page.BlockHeader
				title="Absensi & Jadwal"
				description="Pantau kehadiran karyawan, kelola shift, dan catat clock-in/clock-out harian."
			/>
			<Page.Content className="flex flex-col gap-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Total Kehadiran Hari Ini
							</Card.Title>
							<ClockIcon className="h-4 w-4 text-primary" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold">
								{
									(data?.data ?? []).filter((a) => {
										const d = typeof a.date === 'string' ? new Date(a.date) : a.date
										return d.toISOString().startsWith(today) && a.status === 'present'
									}).length
								}
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Terlambat
							</Card.Title>
							<TimerIcon className="h-4 w-4 text-amber-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold text-amber-600">
								{(data?.data ?? []).filter((a) => a.status === 'late').length}
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">
								Izin / Cuti
							</Card.Title>
							<LogOutIcon className="h-4 w-4 text-primary" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold">
								{(data?.data ?? []).filter((a) => a.status === 'on_leave').length}
							</div>
						</Card.Content>
					</Card>
					<Card>
						<Card.Header className="flex flex-row items-center justify-between pb-2">
							<Card.Title className="text-sm font-medium text-muted-foreground">Absen</Card.Title>
							<LogInIcon className="h-4 w-4 text-rose-500" />
						</Card.Header>
						<Card.Content>
							<div className="text-3xl font-bold text-rose-600">
								{(data?.data ?? []).filter((a) => a.status === 'absent').length}
							</div>
						</Card.Content>
					</Card>
				</div>

				<Card className="rounded-2xl shadow-sm border-muted/60">
					<div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
							<div className="flex flex-col gap-1.5 min-w-[240px]">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Pencarian
								</label>
								<div className="relative">
									<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
									<Input
										placeholder="Cari karyawan..."
										className="pl-9 h-10 bg-secondary/30 border-transparent focus-visible:bg-background"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Dari
								</label>
								<Input
									type="date"
									value={dateFrom}
									onChange={(e) => setDateFrom(e.target.value)}
									className="h-10 bg-secondary/30 border-transparent"
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Sampai
								</label>
								<Input
									type="date"
									value={dateTo}
									onChange={(e) => setDateTo(e.target.value)}
									className="h-10 bg-secondary/30 border-transparent"
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1.5 sm:self-center">
							<label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:block opacity-0">
								Aksi
							</label>
							<Button
								size="sm"
								className="h-10 shadow-md font-medium"
								onClick={async () => {
									// Simple clock-in for first active employee at first location
									const emp = employees[0]
									const loc = locations[0]
									if (!emp || !loc) {
										toast.error('Tidak ada karyawan atau lokasi tersedia')
										return
									}
									await clockInMutation.mutateAsync({
										body: {
											employeeId: emp.id,
											locationId: loc.id,
											note: '',
										},
									})
								}}
								disabled={
									clockInMutation.isPending || employees.length === 0 || locations.length === 0
								}
							>
								<ClockIcon className="size-4 mr-2" /> Clock In
							</Button>
						</div>
					</div>
				</Card>

				<div className="rounded-2xl overflow-hidden border border-muted/60 shadow-sm">
					<DataTableCard
						title="Riwayat Kehadiran"
						table={table as any}
						isLoading={isLoading}
						recordCount={data?.meta?.total ?? 0}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
