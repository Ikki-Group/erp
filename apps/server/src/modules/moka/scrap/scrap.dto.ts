import { z } from 'zod'

import { MokaScrapType, MokaSyncTriggerMode } from '../shared.dto'
import { zp } from '@/lib/validation'

/* ─── Category Raw DTOs ────────────────────────────────────────────────────── */

export const MokaCategoryRawDto = z.object({
	id: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
	synchronized_at: z.string(),
	is_deleted: z.boolean(),
	name: z.string(),
	description: z.string().nullable(),
	business_id: z.number(),
	outlet_id: z.number(),
	guid: z.string(),
	uniq_id: z.string().nullable(),
	items: z.array(z.object({ id: z.number() })),
	has_business_level_entity: z.boolean().optional(),
	gofood_sort_index: z.string().nullable().optional(),
})
export type MokaCategoryRawDto = z.infer<typeof MokaCategoryRawDto>

export const MokaCategoryListDto = z.object({
	results: z.array(MokaCategoryRawDto),
})
export type MokaCategoryListDto = z.infer<typeof MokaCategoryListDto>

/* ─── Product Raw DTOs ─────────────────────────────────────────────────────── */

const MokaSalesTypeItemDto = z.object({
	sales_type_id: z.number(),
	sales_type_name: z.string(),
	sales_type_price: z.number(),
	is_default: z.boolean().optional(),
})

const MokaItemVariantDto = z.object({
	id: z.number(),
	name: z.string().optional(),
	price: z.number().optional(),
	item_id: z.number(),
	created_at: z.number(),
	updated_at: z.number(),
	synchronized_at: z.number(),
	outlet_id: z.number(),
	position: z.number().optional(),
	sku: z.string().optional(),
	is_variable_price: z.boolean().optional(),
	is_recipe: z.boolean().optional(),
	sales_type_items: z.array(MokaSalesTypeItemDto).optional(),
})

const MokaProductCategoryEmbeddedDto = z.object({
	id: z.number(),
	name: z.string(),
	business_id: z.number(),
	created_at: z.number(),
	updated_at: z.number(),
	outlet_id: z.number(),
	guid: z.string(),
	synchronized_at: z.number(),
})

export const MokaProductRawDto = z.object({
	id: z.number(),
	name: z.string(),
	image: z.unknown(),
	business_id: z.number(),
	category_id: z.number(),
	created_at: z.number(),
	updated_at: z.number(),
	outlet_id: z.number(),
	guid: z.string(),
	synchronized_at: z.number(),
	is_recipe: z.boolean().optional(),
	is_sales_type_price: z.boolean().optional(),
	item_variants: z.array(MokaItemVariantDto),
	category: MokaProductCategoryEmbeddedDto,
})
export type MokaProductRawDto = z.infer<typeof MokaProductRawDto>

export const MokaProductListDto = z.object({
	products: z.array(MokaProductRawDto),
})
export type MokaProductListDto = z.infer<typeof MokaProductListDto>

/* ─── Sales Raw DTOs ────────────────────────────────────────────────────────── */

const MokaModifierDto = z
	.object({
		id: z.number().optional(),
		uuid: z.string().optional(),
		modifier_id: z.number().optional(),
		modifier_name: z.string().optional(),
		modifier_option_id: z.number().optional(),
		modifier_option_name: z.string().optional(),
		price: z.number().optional(),
	})
	.loose()

const MokaItemDiscountDto = z
	.object({
		name: z.string().optional(),
		amount: z.number().optional(),
		type: z.string().optional(),
		discount_id: z.number().optional(),
	})
	.loose()

const MokaSalesItemRawDto = z.object({
	id: z.number(),
	uuid: z.string(),
	item_id: z.number(),
	item_name: z.string(),
	item_variant_name: z.string(),
	item_variant_sku: z.string().nullable().optional(),
	item_image: z.string().optional(),
	price: z.number(),
	quantity: z.number(),
	note: z.string().nullable().optional(),
	sales_type_name: z.string().optional(),
	redeem_amount: z.number().optional(),
	is_program_item: z.boolean().optional(),
	void_reason: z.string().nullable().optional(),
	void_by: z.string().nullable().optional(),
	bundle_id: z.number().nullable().optional(),
	item_type: z.string().optional(),
	discounts: z.array(MokaItemDiscountDto).optional(),
	modifiers: z.array(MokaModifierDto).optional(),
	bundle_components: z.array(z.unknown()).optional(),
})
export type MokaSalesItemRawDto = z.infer<typeof MokaSalesItemRawDto>

const MokaSplitPaymentDetailDto = z.object({
	payment_type: z.string(),
	payment_type_label: z.string(),
	collected_amount: z.number(),
	position: z.number(),
	changes_amount: z.number(),
	payment_note: z.string().optional(),
})

const MokaOrderRefundDto = z
	.object({
		amount: z.number().optional(),
		reason: z.string().optional(),
		refunded_by: z.string().optional(),
		created_at: z.string().optional(),
	})
	.loose()

const MokaOrderDiscountDto = z
	.object({
		name: z.string().optional(),
		amount: z.number().optional(),
		type: z.string().optional(),
		discount_id: z.number().optional(),
	})
	.loose()

const MokaOrderTaxDto = z
	.object({
		name: z.string().optional(),
		amount: z.number().optional(),
		rate: z.number().optional(),
		tax_id: z.number().optional(),
	})
	.loose()

const MokaOrderGratuityDto = z
	.object({
		name: z.string().optional(),
		amount: z.number().optional(),
	})
	.loose()

export const MokaSalesDetailRawDto = z
	.object({
		id: z.number(),
		uuid: z.string(),
		payment_no: z.string(),
		parent_order_uuid: z.string().optional(),
		parent_order_created_at: z.string().optional(),
		created_at: z.string(),
		total_collected_amount: z.number(),
		subtotal: z.number(),
		payment_type: z.string(),
		payment_type_label: z.string(),
		payment_note: z.string().optional(),
		tendered: z.number().optional(),
		change: z.number().optional(),
		include_gratuity_tax: z.boolean().optional(),
		enable_tax: z.boolean().optional(),
		enable_gratuity: z.boolean().optional(),
		refundable: z.boolean().optional(),
		total_refund: z.number().optional(),
		outlet_id: z.number().optional(),
		outlet_name: z.string().optional(),
		business_id: z.number().optional(),
		table_name: z.string().optional(),
		order_id: z.string().optional(),
		guid: z.string().optional(),
		items: z.array(MokaSalesItemRawDto).optional(),
		void_items: z.array(MokaSalesItemRawDto).optional(),
		order_refunds: z.array(MokaOrderRefundDto).optional(),
		order_discounts: z.array(MokaOrderDiscountDto).optional(),
		order_taxes: z.array(MokaOrderTaxDto).optional(),
		order_gratuities: z.array(MokaOrderGratuityDto).optional(),
		split_payment_details: z.array(MokaSplitPaymentDetailDto).optional(),
	})
	.loose()

export type MokaSalesDetailRawDto = z.infer<typeof MokaSalesDetailRawDto>

/* ─── ERP-facing DTOs ──────────────────────────────────────────────────────── */

export const MokaProductDetailDto = z.object({
	id: zp.num,
	name: zp.str,
	categoryId: zp.num,
	categoryName: zp.str,
	hasVariants: z.boolean(),
	hasSalesTypePricing: z.boolean(),
	basePrice: zp.decimal,
	item_variants: z.array(
		z.object({
			id: zp.num,
			name: zp.str.nullable(),
			price: zp.decimal,
			sku: zp.str.nullable(),
			sales_type_items: z
				.array(
					z.object({
						sales_type_id: zp.num,
						sales_type_name: zp.str,
						sales_type_price: zp.decimal,
						is_default: z.boolean().optional(),
					}),
				)
				.optional(),
		}),
	),
})
export type MokaProductDetailDto = z.infer<typeof MokaProductDetailDto>

export const MokaTriggerInputDto = z.object({
	locationId: zp.id,
	type: MokaScrapType,
	triggerMode: MokaSyncTriggerMode.optional().default('manual'),
	dateFrom: zp.date.optional(),
	dateTo: zp.date.optional(),
})
export type MokaTriggerInputDto = z.infer<typeof MokaTriggerInputDto>
