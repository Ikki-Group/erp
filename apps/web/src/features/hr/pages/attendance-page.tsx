import { Page } from '@/components/layout/page'

export function AttendancePage() {
	return (
		<Page size="xl">
			<Page.BlockHeader title="Absensi & Jadwal" description="Halaman absensi dan jadwal akan ditampilkan di sini." />
			<Page.Content>
				<div className="p-6 border border-dashed rounded-lg">
					<p className="text-muted-foreground text-center">Fitur absensi dalam pengembangan</p>
				</div>
			</Page.Content>
		</Page>
	)
}
