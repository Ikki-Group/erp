import { useState } from 'react'

// oxlint-disable max-lines
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'

import {
	AlertTriangleIcon,
	Building2Icon,
	CalendarIcon,
	ChevronRightIcon,
	EditIcon,
	HistoryIcon,
	InfoIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
	PowerIcon,
	StoreIcon,
	TrashIcon,
	UserMinusIcon,
	UserPlusIcon,
	UsersIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'

import { CardSection } from '@/components/blocks/card/card-section'
import { DataList } from '@/components/blocks/data-display/data-list'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { ButtonLoading } from '@/components/ui/button-loading'
import { Separator } from '@/components/ui/separator'

import { assignmentApi, userApi } from '@/features/iam'

import { locationApi } from '../api'
import { LocationAssignMemberDialog } from './location-assign-member-dialog'

interface LocationDetailPageProps {
	id: number
}

export function LocationDetailPage({ id }: LocationDetailPageProps) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const { data: locationResult } = useSuspenseQuery({ ...locationApi.detail.query({ id }) })
	const location = locationResult.data

	const { data: membersResult } = useSuspenseQuery({
		...userApi.list.query({ locationId: id, limit: 100 }),
	})
	const members = membersResult.data ?? []

	const updateMutation = useMutation({
		mutationFn: locationApi.update.mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: locationApi.detail.query({ id }).queryKey })
			queryClient.invalidateQueries({ queryKey: ['location'] })
		},
	})

	const removeMutation = useMutation({
		mutationFn: locationApi.remove.mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['location'] })
			navigate({ to: '/location', replace: true })
		},
	})

	const removeMemberMutation = useMutation({
		mutationFn: userAssignmentApi.remove.mutationFn,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['iam', 'user', 'list', { locationId: id }] })
		},
	})

	async function toggleStatus() {
		const promise = updateMutation.mutateAsync({
			body: { ...location, id, isActive: !location.isActive },
		})

		await toast
			.promise(promise, {
				loading: 'Mengubah status...',
				// oxlint-disable-next-line no-negated-condition
				success: `Lokasi berhasil ${!location.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
				error: 'Gagal mengubah status',
			})
			.unwrap()
	}

	async function handleDelete() {
		const promise = removeMutation.mutateAsync({ body: { id } })

		await toast
			.promise(promise, {
				loading: 'Menghapus lokasi...',
				success: 'Lokasi berhasil dihapus (soft delete)',
				error: 'Gagal menghapus lokasi',
			})
			.unwrap()
	}

	async function handleRemoveMember(userId: number, fullname: string) {
		if (!confirm(`Hapus ${fullname} dari lokasi ini?`)) return

		const promise = removeMemberMutation.mutateAsync({ body: { userId, locationId: id } })

		await toast
			.promise(promise, {
				loading: 'Menghapus anggota...',
				success: 'Anggota berhasil dihapus dari lokasi',
				error: 'Gagal menghapus anggota',
			})
			.unwrap()
	}

	return (
		<Page size="lg">
			<Page.BlockHeader
				title={location.name}
				description="Detail informasi lokasi dan daftar pengguna yang ditugaskan."
				back={{ to: '/location' }}
				action={
					<div className="flex items-center gap-2">
						<ButtonLoading
							variant={location.isActive ? 'destructive' : 'default'}
							size="sm"
							loading={updateMutation.isPending}
							// oxlint-disable-next-line typescript/no-misused-promises
							onClick={toggleStatus}
						>
							<PowerIcon className="mr-2" />
							{location.isActive ? 'Nonaktifkan' : 'Aktifkan'}
						</ButtonLoading>

						<Link
							to="/location/$id/edit"
							params={{ id: String(id) }}
							className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
						>
							<EditIcon className="mr-2" />
							Edit
						</Link>

						<Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
							<TrashIcon className="mr-2" />
							Hapus
						</Button>
					</div>
				}
			/>

			<Page.Content className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Details & Members */}
				<div className="lg:col-span-2 space-y-6">
					<CardSection title="Informasi Lokasi" icon={<InfoIcon className="size-4 text-primary" />}>
						<DataList cols={2}>
							<DataList.Item label="Nama Lokasi" value={location.name} />
							<DataList.Item
								label="Kode"
								value={<code className="font-mono text-xs">{location.code}</code>}
							/>
							<DataList.Item
								label="Tipe"
								value={
									<Badge
										variant={location.type === 'store' ? 'info-outline' : 'warning-outline'}
										size="sm"
									>
										{location.type === 'store' ? (
											<StoreIcon className="mr-1 size-3" />
										) : (
											<Building2Icon className="mr-1 size-3" />
										)}
										{location.type === 'store' ? 'Store' : 'Warehouse'}
									</Badge>
								}
							/>
							<DataList.Item
								label="Status"
								value={
									<Badge
										variant={location.isActive ? 'success-outline' : 'destructive-outline'}
										size="sm"
									>
										{location.isActive ? 'Aktif' : 'Non-Aktif'}
									</Badge>
								}
							/>

							<DataList.Item label="Deskripsi" span={2} value={location.description ?? '-'} />

							{location.address && (
								<DataList.Item
									label="Alamat"
									span={2}
									value={
										<div className="flex items-start gap-2">
											<MapPinIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
											<span>{location.address}</span>
										</div>
									}
								/>
							)}

							{location.phone && (
								<DataList.Item
									label="Kontak"
									value={
										<div className="flex items-center gap-2">
											<PhoneIcon className="size-4 text-muted-foreground shrink-0" />
											<span>{location.phone}</span>
										</div>
									}
								/>
							)}
						</DataList>
					</CardSection>

					<CardSection
						title="Daftar Anggota"
						icon={<UsersIcon className="size-4 text-primary" />}
						description={`${members.length} pengguna ditugaskan ke lokasi ini`}
						action={
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								onClick={() => {
									LocationAssignMemberDialog.call({ locationId: id, locationName: location.name })
								}}
							>
								<UserPlusIcon className="mr-2 size-3.5" />
								Tugaskan Anggota
							</Button>
						}
					>
						<div className="border rounded-lg overflow-hidden divide-y">
							{members.length === 0 ? (
								<div className="p-8 text-center bg-muted/20">
									<p className="text-sm text-muted-foreground">
										Belum ada anggota yang ditugaskan.
									</p>
									<Button
										variant="link"
										size="sm"
										className="mt-1"
										onClick={() => {
											LocationAssignMemberDialog.call({
												locationId: id,
												locationName: location.name,
											})
										}}
									>
										Tugaskan Sekarang
									</Button>
								</div>
							) : (
								members.map((user) => (
									<div
										key={user.id}
										className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
									>
										<div className="flex items-center gap-3">
											<div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
												{user.fullname.charAt(0)}
											</div>
											<div className="flex flex-col">
												<span className="text-sm font-semibold">{user.fullname}</span>
												<div className="flex items-center gap-2 text-xs text-muted-foreground">
													<span className="flex items-center gap-1">
														<MailIcon className="size-3" />
														{user.email}
													</span>
												</div>
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon-sm"
												className="text-muted-foreground hover:text-destructive"
												onClick={() => {
													handleRemoveMember(user.id, user.fullname)
												}}
											>
												<UserMinusIcon className="size-4" />
											</Button>
											<Link
												to="/settings/user/$id"
												params={{ id: String(user.id) }}
												className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
											>
												<ChevronRightIcon className="size-4" />
											</Link>
										</div>
									</div>
								))
							)}
						</div>
					</CardSection>
				</div>

				{/* Right Column: Audit & Stats */}
				<div className="space-y-6">
					<CardSection title="Audit" icon={<HistoryIcon className="size-4 text-primary" />}>
						<div className="space-y-4 pt-2">
							<div className="flex items-start gap-3">
								<CalendarIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
								<div className="flex flex-col gap-1">
									<span className="text-xs font-semibold text-muted-foreground uppercase">
										Dibuat Pada
									</span>
									<span className="text-sm">
										{new Date(location.createdAt).toLocaleString('id-ID')}
									</span>
								</div>
							</div>

							<Separator />

							<div className="flex items-start gap-3">
								<HistoryIcon className="mt-1 size-4 text-muted-foreground shrink-0" />
								<div className="flex flex-col gap-1">
									<span className="text-xs font-semibold text-muted-foreground uppercase">
										Terakhir Diperbarui
									</span>
									<span className="text-sm">
										{new Date(location.updatedAt).toLocaleString('id-ID')}
									</span>
								</div>
							</div>

							<Separator className="border-dashed" />

							<div className="flex flex-col gap-1.5 p-3 rounded-md bg-muted/30 border border-dashed">
								<span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
									System Identifiers
								</span>
								<div className="flex justify-between items-center text-xs">
									<span className="text-muted-foreground">Record ID</span>
									<span className="font-mono">#{location.id}</span>
								</div>
							</div>
						</div>
					</CardSection>
				</div>
			</Page.Content>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
							<AlertTriangleIcon className="size-6 text-destructive" />
						</div>
						<AlertDialogTitle>Hapus Lokasi?</AlertDialogTitle>
						<AlertDialogDescription>
							Tindakan ini akan menghapus{' '}
							<span className="font-bold text-foreground">{location.name}</span> dari daftar aktif.
							Data historis akan tetap tersimpan di sistem.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							className={buttonVariants({ variant: 'destructive' })}
							onClick={(e) => {
								e.preventDefault()
								handleDelete()
								setIsDeleteDialogOpen(false)
							}}
						>
							Ya, Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Page>
	)
}
