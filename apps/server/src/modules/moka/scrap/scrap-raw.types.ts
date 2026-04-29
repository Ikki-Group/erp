/* ─── Category ──────────────────────────────────────────────────────────────── */

export interface MokaCategoryRaw {
	id: number
	created_at: string
	updated_at: string
	synchronized_at: string
	is_deleted: boolean
	name: string
	description: string | null
	business_id: number
	outlet_id: number
	guid: string
	uniq_id: string | null
	items: Array<{ id: number }>
	has_business_level_entity?: boolean | undefined
	gofood_sort_index?: string | null | undefined
}

/** Moka API wraps categories in { results: [...] } */
export interface MokaCategoryListResponse {
	results: MokaCategoryRaw[]
}

/* ─── Product ──────────────────────────────────────────────────────────────── */

export interface MokaSalesTypeItemRaw {
	sales_type_id: number
	sales_type_name: string
	sales_type_price: number
	is_default?: boolean | undefined
}

export interface MokaItemVariantRaw {
	id: number
	name?: string | undefined
	price?: number | undefined
	item_id: number
	created_at: number /** epoch ms */
	updated_at: number /** epoch ms */
	synchronized_at: number /** epoch ms */
	outlet_id: number
	position?: number | undefined
	sku?: string | undefined
	is_variable_price?: boolean | undefined
	is_recipe?: boolean | undefined
	sales_type_items?: MokaSalesTypeItemRaw[] | undefined
}

export interface MokaProductImageRaw {
	url?: string | undefined
	id?: number | undefined
	height?: number | undefined
	width?: number | undefined
}

export interface MokaProductCategoryEmbeddedRaw {
	id: number
	name: string
	business_id: number
	created_at: number /** epoch ms */
	updated_at: number /** epoch ms */
	outlet_id: number
	guid: string
	synchronized_at: number /** epoch ms */
}

export interface MokaProductRaw {
	id: number
	name: string
	image: unknown /** {} when empty, or object with url */
	business_id: number
	category_id: number
	created_at: number /** epoch ms */
	updated_at: number /** epoch ms */
	outlet_id: number
	guid: string
	synchronized_at: number /** epoch ms */
	is_recipe?: boolean | undefined
	is_sales_type_price?: boolean | undefined
	item_variants: MokaItemVariantRaw[]
	category: MokaProductCategoryEmbeddedRaw
}

/** Moka API wraps products in { products: [...] } */
export interface MokaProductListResponse {
	products: MokaProductRaw[]
}

/* ─── Sales ─────────────────────────────────────────────────────────────────── */

export interface MokaSalesItemRaw {
	id: number /** always 0 from Moka — use uuid as identifier */
	uuid: string
	item_id: number
	item_name: string
	item_variant_name: string
	item_variant_sku: string
	item_image: string
	price: number
	quantity: number
	note: string
	sales_type_name: string
	redeem_amount: number
	is_program_item: boolean
	void_reason: string | null
	void_by: string | null
	bundle_id: number | null
	item_type: string
	discounts: unknown[]
	modifiers: MokaModifierRaw[]
	bundle_components: unknown[]
}

export interface MokaModifierRaw {
	id?: number | undefined
	uuid: string
	created_at?: string | undefined
	updated_at?: string | null | undefined
	gross_sales?: number | undefined
	net_sales?: number | undefined
	modifier_id?: number | undefined
	discount_amount?: number | undefined
	modifier_option_name: string
	price: number
	modifier_name: string
	modifier_option_id?: number | undefined
	cogs?: number | undefined
	redeem_amount?: number | undefined
	discounts?: unknown[] | undefined
}

export interface MokaSplitPaymentDetailRaw {
	payment_type: string
	payment_type_label: string
	collected_amount: number
	position: number
	changes_amount: number
	payment_note: string
}

export interface MokaRefundAvailabilityRaw {
	parent_order_item_id: number
	parent_order_item_uuid: string
	item_id: number
	item_name: string
	item_variant_id: number
	item_variant_name: string
	item_variant_sku: string
	item_image: string
	category_id: number
	category_name: string
	is_track_stock: boolean
	position: number
	price: number
	price_per_item: number
	quantity: number
	gross_per_item: number
	discount_per_item: number
	redemption_per_item: number
	tax_per_item: number
	gratuity_per_item: number
	net_per_item: number
	sales_type_name: string
	sales_type_id: number
	bundle_id: number | null
	item_type: string
	gratuities: unknown[]
	modifiers: unknown[]
	discounts: unknown[]
}

export interface MokaSalesDetailRaw {
	id: number /** always 0 from Moka */
	uuid: string
	payment_no: string
	parent_order_uuid: string
	parent_order_created_at: string
	created_at: string /** ISO */
	total_collected_amount: number
	subtotal: number
	payment_type: string
	payment_type_label: string
	payment_note: string
	tendered: number
	change: number
	include_gratuity_tax: boolean
	enable_tax: boolean
	enable_gratuity: boolean
	card_type: string | null
	card_no: string | null
	collector_name: string
	creator_name: string
	server_name: string
	business_name: string
	business_logo: string | null
	business_address: string
	outlet_id: number
	outlet_name: string
	outlet_address: string
	outlet_phone: string
	outlet_logo: string | null
	business_id: number
	customer_email: string
	customer_phone: string
	customer_name: string
	table_name: string
	total_redeem_amount: number
	total_rounding_amount: number
	refundable: boolean
	total_refund: number
	receipt_count: number
	pax: number
	bill_name: string
	order_id: string
	guid: string
	bill_created_at: string
	items: MokaSalesItemRaw[]
	order_items?: Record<string, MokaSalesItemRaw[]> | undefined
	void_items: MokaSalesItemRaw[]
	order_refunds: unknown[]
	order_discounts: unknown[]
	order_taxes: unknown[]
	order_gratuities: unknown[]
	promos: unknown[]
	refund_availability: MokaRefundAvailabilityRaw[]
	loyalty: unknown
	split_payment_details?: MokaSplitPaymentDetailRaw[] | undefined
	total_amount_received: number | null
	total_amount_due: number | null
	invoice_due_date: string | null
	invoice_deposit_amount: number | null
	invoice_no: string | null
	invoice_status: string | null
	invoice_payment_records: unknown[]
	status_description: string | null
}

/** Moka sales list response (for fetching order tokens) */
export interface MokaSalesListResponse {
	orders: Array<{ order_token: string }>
	next_cursor: string | null
}

/** Moka daily sales response wraps in { summary, results } */
export interface MokaSalesDayResponse {
	summary: { trx: number; gross: number }
	results: MokaSalesDetailRaw[]
}

/* ─── Auth ──────────────────────────────────────────────────────────────────── */

export interface MokaLoginResponse {
	access_token: string
	token_type: string
	expires_in: number
	outlets: Array<{ id: number; name: string }>
}
