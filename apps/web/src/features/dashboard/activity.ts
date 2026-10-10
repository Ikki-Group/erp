import type { AuditLogDto } from '@/features/audit/dto/index.ts'

const VERBS: Record<string, string> = {
	create: 'membuat',
	update: 'mengubah',
	delete: 'menghapus',
	confirm: 'mengonfirmasi',
	complete: 'menyelesaikan',
	ship: 'mengirim',
	receive: 'menerima',
	void: 'membatalkan',
	assign: 'menugaskan',
	unassign: 'mencabut',
	'reset-password': 'mereset kata sandi',
}

const ENTITIES: Record<string, string> = {
	company: 'pengaturan perusahaan',
	location: 'lokasi',
	material: 'material',
	material_category: 'kategori material',
	material_location: 'penugasan material',
	menu_category: 'kategori menu',
	menu_item: 'menu',
	modifier_group: 'grup modifier',
	payment_method: 'metode pembayaran',
	payment_method_location: 'metode pembayaran lokasi',
	receiving: 'penerimaan',
	recipe: 'resep',
	role: 'peran',
	stock_opname: 'opname',
	supplier: 'supplier',
	transfer_request: 'transfer',
	uom: 'satuan',
	uom_conversion: 'konversi satuan',
	user: 'pengguna',
	user_assignment: 'penugasan pengguna',
}

/** Production reuses the generic `order` entity name. */
const MODULE_ENTITIES: Record<string, string> = { 'production.order': 'order produksi' }

export interface ActivityLine {
	actor: string
	verb: string
	entity: string
	/** The record's own name, or its document number (`code`), when the summary carries one. */
	subject: { text: string; code: boolean } | null
}

/**
 * Reads the subject out of the server's summary: a quoted name (`"Kopi"`) or a
 * document number (`TRF-STORE-01-0001`). Everything else in the summary is
 * internal ids (`#12`) we deliberately drop.
 */
function subjectOf(summary: string): ActivityLine['subject'] {
	const quoted = /"([^"]+)"/u.exec(summary)
	if (quoted?.[1]) return { text: quoted[1], code: false }
	const docNo = /\b[A-Z]{2,}(?:-[A-Z0-9]+)+\b/u.exec(summary)
	return docNo ? { text: docNo[0], code: true } : null
}

export function humanizeActivity(
	entry: Pick<AuditLogDto, 'userName' | 'module' | 'entity' | 'action' | 'summary'>,
): ActivityLine {
	return {
		actor: entry.userName,
		verb: VERBS[entry.action] ?? entry.action.replaceAll('-', ' '),
		entity:
			MODULE_ENTITIES[`${entry.module}.${entry.entity}`] ??
			ENTITIES[entry.entity] ??
			entry.entity.replaceAll('_', ' '),
		subject: subjectOf(entry.summary),
	}
}
