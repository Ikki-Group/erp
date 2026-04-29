import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'

import {
	ChevronRightIcon,
	EditIcon,
	PowerIcon,
	TrashIcon,
	UserMinusIcon,
	UserPlusIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { AuditCard } from '@/components/blocks/card/audit-card'
import { CardSection } from '@/components/blocks/card/card-section'
import { DataList } from '@/components/blocks/data-display/data-list'
import { ConfirmDialog } from '@/components/blocks/feedback/confirm-dialog'
import { Page } from '@/components/layout/page'
import { Badge } from '@/components/reui/badge'

import { Button } from '@/components/ui/button'

import { assignmentApi, userApi } from '@/features/iam'

import { locationApi } from '../api'
import { LocationAssignMemberDialog } from './location-assign-member-dialog'

interface LocationDetailPageProps {
	id: number
}

export function LocationDetailPage({ id }: LocationDetailPageProps) {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

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
		mutationFn: assignmentApi.remove.mutationFn,
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
				success: `Lokasi berhasil ${!location.isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
				error: 'Gagal mengubah status',
			})
			.unwrap()
	}

	async function handleDelete() {
		await ConfirmDialog.call({
			title: 'Hapus Lokasi',
			description: `Tindakan ini akan menghapus ${location.name} dari daftar aktif. Data historis akan tetap tersimpan di sistem.`,
			variant: 'destructive',
			confirmLabel: 'Ya, Hapus',
			confirmValidationText: location.name,
			onConfirm: async () => {
				await toast
					.promise(removeMutation.mutateAsync({ body: { id } }), {
						loading: 'Menghapus lokasi...',
						success: 'Lokasi berhasil dihapus',
						error: 'Gagal menghapus lokasi',
					})
					.unwrap()
			},
		})
	}

	async function handleRemoveMember(userId: number, fullname: string) {
		await ConfirmDialog.call({
			title: 'Hapus Anggota',
			description: `Apakah Anda yakin ingin menghapus ${fullname} dari lokasi ini?`,
			variant: 'destructive',
			confirmLabel: 'Hapus Anggota',
			onConfirm: async () => {
				await toast
					.promise(removeMemberMutation.mutateAsync({ body: { userId, locationId: id } }), {
						loading: 'Menghapus anggota...',
						success: 'Anggota berhasil dihapus dari lokasi',
						error: 'Gagal menghapus anggota',
					})
					.unwrap()
			},
		})
	}

	return (
		<Page size="lg">
			<Page.BlockHeader
				title={location.name}
				description="Detail informasi lokasi dan daftar pengguna yang ditugaskan."
				back={{ to: '/location' }}
				action={
					<div className="flex items-center gap-2">
						<Button
							variant={location.isActive ? 'destructive' : 'default'}
							size="sm"
							disabled={updateMutation.isPending}
							onClick={toggleStatus}
						>
							<PowerIcon className="mr-2" />
							{location.isActive ? 'Nonaktifkan' : 'Aktifkan'}
						</Button>

						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<Link to="/location/$id/edit" params={{ id: String(id) }} />}
						>
							<EditIcon className="mr-2" />
							Edit
						</Button>

						<Button variant="destructive" size="sm" onClick={handleDelete}>
							<TrashIcon className="mr-2" />
							Hapus
						</Button>
					</div>
				}
			/>

			<Page.Content className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column: Details & Members */}
				<div className="lg:col-span-2 space-y-6">
					<CardSection title="Informasi Lokasi">
						<DataList cols={2}>
							<DataList.Item label="Nama" value={location.name} />
							<DataList.Item label="Kode" value={location.code} />
							<DataList.Item
								label="Tipe"
								value={
									<Badge
										variant={location.type === 'store' ? 'info-outline' : 'warning-outline'}
										size="sm"
									>
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
								<DataList.Item label="Alamat" span={2} value={location.address} />
							)}
							{location.phone && <DataList.Item label="Kontak" value={location.phone} />}
						</DataList>
					</CardSection>

					<CardSection
						title="Daftar Anggota"
						description={`${members.length} pengguna ditugaskan ke lokasi ini`}
						action={
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									LocationAssignMemberDialog.call({ locationId: id, locationName: location.name })
								}}
							>
								<UserPlusIcon className="mr-2" />
								Tugaskan
							</Button>
						}
					>
						<div className="divide-y">
							{members.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									Belum ada anggota yang ditugaskan.
								</p>
							) : (
								members.map((user) => (
									<div
										key={user.id}
										className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
									>
										<div className="flex flex-col gap-0.5 min-w-0">
											<span className="font-medium truncate">{user.fullname}</span>
											<span className="text-sm text-muted-foreground truncate">{user.email}</span>
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
												<UserMinusIcon />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												nativeButton={false}
												render={<Link to="/settings/user/$id" params={{ id: String(user.id) }} />}
											>
												<ChevronRightIcon />
											</Button>
										</div>
									</div>
								))
							)}
						</div>
					</CardSection>
				</div>

				{/* Right Column: Audit & Stats */}
				<div className="space-y-6">
					<AuditCard
						createdAt={location.createdAt}
						updatedAt={location.updatedAt}
						recordId={location.id}
					/>
				</div>
			</Page.Content>
		</Page>
	)
}
