import { Page } from '@/components/layout/page'

export function PayrollPage() {
	return (
		<Page size="xl">
			<Page.BlockHeader title="Penggajian (Payroll)" description="Halaman penggajian akan ditampilkan di sini." />
			<Page.Content>
				<div className="p-6 border border-dashed rounded-lg">
					<p className="text-muted-foreground text-center">Fitur penggajian dalam pengembangan</p>
				</div>
			</Page.Content>
		</Page>
	)
}
