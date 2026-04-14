import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@uidotdev/usehooks'
import { Loader2Icon, SearchIcon, UserPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { createCallable } from 'react-call'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { roleApi, userApi, userAssignmentApi } from '@/features/iam'

interface LocationAssignMemberDialogProps {
	locationId: number
	locationName: string
}

export const LocationAssignMemberDialog = createCallable<LocationAssignMemberDialogProps>(
	(props) => {
		const { call, locationId, locationName } = props
		const queryClient = useQueryClient()

		const [search, setSearch] = useState('')
		const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
		const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
		const debouncedSearch = useDebounce(search, 300)

		// 1. Fetch users
		const { data: usersData, isLoading: isLoadingUsers } = useQuery(
			userApi.list.query({ page: 1, limit: 10, q: debouncedSearch || undefined, isActive: true }),
		)

		// 2. Fetch roles
		const { data: rolesData, isLoading: isLoadingRoles } = useQuery(
			roleApi.list.query({ page: 1, limit: 100 }),
		)

		const assignMutation = useMutation({
			mutationFn: userAssignmentApi.assign.mutationFn,
			onSuccess: () => {
				// Invalidate user list for this location
				queryClient.invalidateQueries({ queryKey: ['iam', 'user', 'list'] })
			},
		})

		async function handleAssign() {
			if (!selectedUserId || !selectedRoleId) return

			const promise = assignMutation.mutateAsync({
				body: { userId: selectedUserId, locationId, roleId: selectedRoleId },
			})

			await toast
				.promise(promise, {
					loading: 'Menugaskan anggota...',
					success: 'Berhasil menugaskan anggota ke lokasi',
					error: 'Gagal menugaskan anggota',
				})
				.unwrap()

			call.end()
		}

		const users = usersData?.data ?? []
		const roles = rolesData?.data ?? []

		return (
			<Dialog open={!call.ended} onOpenChange={() => call.end()}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="border-b pb-4">
						<DialogTitle>Tugaskan Anggota</DialogTitle>
						<DialogDescription>
							Tugaskan pengguna ke lokasi{' '}
							<span className="font-medium text-foreground">{locationName}</span>
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label>Pilih Pengguna</Label>
							<div className="relative">
								<SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
								<Input
									placeholder="Cari nama atau email..."
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									className="pl-8"
								/>
							</div>
							<ScrollArea className="h-44 border rounded-md mt-2">
								{isLoadingUsers ? (
									<div className="flex flex-col items-center justify-center p-8 gap-2 text-muted-foreground">
										<Loader2Icon className="size-5 animate-spin" />
										<span className="text-xs">Mencari...</span>
									</div>
								) : users.length === 0 ? (
									<div className="p-8 text-center text-xs text-muted-foreground italic">
										Gunakan kolom pencarian di atas untuk mencari pengguna
									</div>
								) : (
									<div className="divide-y">
										{users.map((u) => (
											<button
												key={u.id}
												type="button"
												onClick={() => setSelectedUserId(u.id)}
												className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted/50 transition-colors ${
													selectedUserId === u.id
														? 'bg-primary/5 ring-1 ring-inset ring-primary/20'
														: ''
												}`}
											>
												<div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
													{u.fullname.charAt(0)}
												</div>
												<div className="flex flex-col min-w-0">
													<span className="text-sm font-medium truncate">{u.fullname}</span>
													<span className="text-[10px] text-muted-foreground truncate">
														{u.email}
													</span>
												</div>
											</button>
										))}
									</div>
								)}
							</ScrollArea>
						</div>

						<div className="space-y-2">
							<Label>Pilih Role</Label>
							<Select onValueChange={(v) => setSelectedRoleId(Number(v))}>
								<SelectTrigger>
									<SelectValue placeholder="Pilih jabatan/peran..." />
								</SelectTrigger>
								<SelectContent>
									{isLoadingRoles ? (
										<div className="flex items-center justify-center p-4">
											<Loader2Icon className="size-4 animate-spin" />
										</div>
									) : (
										roles.map((r) => (
											<SelectItem key={r.id} value={String(r.id)}>
												{r.name}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter className="bg-muted/30 p-4 -mx-6 -mb-6 border-t">
						<Button variant="ghost" type="button" onClick={() => call.end()}>
							Batal
						</Button>
						<Button
							onClick={handleAssign}
							disabled={!selectedUserId || !selectedRoleId || assignMutation.isPending}
							className="min-w-[120px]"
						>
							{assignMutation.isPending ? (
								<Loader2Icon className="size-4 animate-spin" />
							) : (
								<>
									<UserPlusIcon className="mr-2 size-4" />
									Tugaskan
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		)
	},
)
