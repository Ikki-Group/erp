import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { stampCreate, takeFirst, type DbClient, type DbTx } from '@/core/database'

import {
	productCategoriesTable,
	productExternalMappingsTable,
	productPricesTable,
	productsTable,
	productVariantsTable,
	salesExternalRefsTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesTypesTable,
	variantPricesTable,
} from '@/db/schema'

import type { AccountService } from '@/modules/finance'
import type { GeneralLedgerService } from '@/modules/finance'

import type {
	MokaCategoryRaw,
	MokaItemVariantRaw,
	MokaProductRaw,
	MokaSalesDetailRaw,
	MokaSalesItemRaw,
} from './scrap-raw.types'

export class MokaTransformationService {
	constructor(
		private readonly db: DbClient,
		private readonly accountSvc: AccountService,
		private readonly journalSvc: GeneralLedgerService,
	) {}

	/* ─── Category Sync ─────────────────────────────────────────────────────── */

	async transformCategories(_locationId: number, categories: MokaCategoryRaw[], actorId: number) {
		return record('MokaTransformationService.transformCategories', async () => {
			for (const cat of categories) {
				if (cat.is_deleted) {
					// Soft-deleted in Moka — skip (no categoryExternalMappingsTable yet)
					continue
				}

				// Check by name to avoid duplicates
				const byName = await this.db
					.select()
					.from(productCategoriesTable)
					.where(
						and(
							eq(productCategoriesTable.name, cat.name),
							isNull(productCategoriesTable.deletedAt),
						),
					)
				const existing = takeFirst(byName)

				if (existing) {
					await this.db
						.update(productCategoriesTable)
						.set({ name: cat.name, description: cat.description, ...stampCreate(actorId) })
						.where(eq(productCategoriesTable.id, existing.id))
				} else {
					await this.db
						.insert(productCategoriesTable)
						.values({ name: cat.name, description: cat.description, ...stampCreate(actorId) })
				}
			}
		})
	}

	/* ─── Product Sync ───────────────────────────────────────────────────────── */

	async transformProducts(locationId: number, products: MokaProductRaw[], actorId: number) {
		return record('MokaTransformationService.transformProducts', async () => {
			for (const prod of products) {
				await this.syncSingleProduct(locationId, prod, actorId)
			}
		})
	}

	private async syncSingleProduct(locationId: number, prod: MokaProductRaw, actorId: number) {
		const mapping = await this.findProductMapping(String(prod.id))

		if (mapping) {
			const defaultVariant = prod.item_variants[0]
			const basePrice = this.getDefaultPrice(defaultVariant)

			await this.db
				.update(productsTable)
				.set({
					name: prod.name,
					basePrice: String(basePrice),
					hasVariants: prod.item_variants.length > 1,
					hasSalesTypePricing: prod.is_sales_type_price ?? false,
					categoryId: await this.resolveCategoryId(prod.category?.name),
					...stampCreate(actorId),
				})
				.where(eq(productsTable.id, mapping.productId))

			await this.db
				.update(productExternalMappingsTable)
				.set({ lastSyncedAt: new Date(), externalData: prod })
				.where(eq(productExternalMappingsTable.id, mapping.id))

			await this.syncVariants(mapping.productId, prod.item_variants, actorId)
		} else {
			const defaultVariant = prod.item_variants[0]
			const basePrice = this.getDefaultPrice(defaultVariant)
			const categoryId = await this.resolveCategoryId(prod.category?.name)

			const [newProd] = await this.db
				.insert(productsTable)
				.values({
					name: prod.name,
					sku: defaultVariant?.sku ?? `MOKA-${prod.id}`,
					locationId,
					categoryId,
					status: 'active',
					basePrice: String(basePrice),
					hasVariants: prod.item_variants.length > 1,
					hasSalesTypePricing: prod.is_sales_type_price ?? false,
					...stampCreate(actorId),
				})
				.returning({ id: productsTable.id })

			if (!newProd) return

			await this.db.insert(productExternalMappingsTable).values({
				productId: newProd.id,
				provider: 'moka',
				externalId: String(prod.id),
				externalData: prod,
				lastSyncedAt: new Date(),
				...stampCreate(actorId),
			})

			await this.syncVariants(newProd.id, prod.item_variants, actorId)
		}
	}

	private async syncVariants(productId: number, variants: MokaItemVariantRaw[], actorId: number) {
		const hasMultipleVariants = variants.length > 1

		for (const v of variants) {
			if (!hasMultipleVariants) {
				// Single variant — product itself IS the variant, skip variant row
				// Still sync sales type prices at product level
				await this.syncSalesTypePrices(productId, null, v, actorId)
				continue
			}

			// Multiple variants — upsert each
			const existing = await this.db
				.select()
				.from(productVariantsTable)
				.where(
					and(
						eq(productVariantsTable.productId, productId),
						eq(productVariantsTable.name, v.name ?? 'Default'),
					),
				)
			const existingVariant = takeFirst(existing)

			if (existingVariant) {
				await this.db
					.update(productVariantsTable)
					.set({
						name: v.name ?? 'Default',
						sku: v.sku ?? null,
						basePrice: String(v.price ?? 0),
						...stampCreate(actorId),
					})
					.where(eq(productVariantsTable.id, existingVariant.id))

				await this.ensureVariantMapping(productId, existingVariant.id, v.id, actorId)
				await this.syncSalesTypePrices(productId, existingVariant.id, v, actorId)
			} else {
				const [newVar] = await this.db
					.insert(productVariantsTable)
					.values({
						productId,
						name: v.name ?? 'Default',
						sku: v.sku ?? null,
						basePrice: String(v.price ?? 0),
						isDefault: v.position === undefined || v.position === 0,
						...stampCreate(actorId),
					})
					.returning({ id: productVariantsTable.id })

				if (newVar) {
					await this.ensureVariantMapping(productId, newVar.id, v.id, actorId)
					await this.syncSalesTypePrices(productId, newVar.id, v, actorId)
				}
			}
		}
	}

	private async syncSalesTypePrices(
		productId: number,
		variantId: number | null,
		variant: MokaItemVariantRaw,
		actorId: number,
	) {
		if (!variant.sales_type_items?.length) return

		for (const st of variant.sales_type_items) {
			const salesType = await this.ensureSalesType(st.sales_type_name, actorId)
			if (!salesType) continue

			if (variantId) {
				// Variant-level pricing
				await this.db
					.insert(variantPricesTable)
					.values({
						variantId,
						salesTypeId: salesType.id,
						price: String(st.sales_type_price),
						...stampCreate(actorId),
					})
					.onConflictDoUpdate({
						target: [variantPricesTable.variantId, variantPricesTable.salesTypeId],
						set: { price: String(st.sales_type_price), ...stampCreate(actorId) },
					})
			} else {
				// Product-level pricing (no variant)
				await this.db
					.insert(productPricesTable)
					.values({
						productId,
						salesTypeId: salesType.id,
						price: String(st.sales_type_price),
						...stampCreate(actorId),
					})
					.onConflictDoUpdate({
						target: [productPricesTable.productId, productPricesTable.salesTypeId],
						set: { price: String(st.sales_type_price), ...stampCreate(actorId) },
					})
			}
		}
	}

	private async ensureVariantMapping(
		productId: number,
		variantId: number,
		mokaVariantId: number,
		actorId: number,
	) {
		const existing = await this.db
			.select()
			.from(productExternalMappingsTable)
			.where(
				and(
					eq(productExternalMappingsTable.provider, 'moka'),
					eq(productExternalMappingsTable.productId, productId),
					eq(productExternalMappingsTable.variantId, variantId),
				),
			)
		if (takeFirst(existing)) return

		await this.db.insert(productExternalMappingsTable).values({
			productId,
			variantId,
			provider: 'moka',
			externalId: String(mokaVariantId),
			lastSyncedAt: new Date(),
			...stampCreate(actorId),
		})
	}

	/* ─── Sales Sync ────────────────────────────────────────────────────────── */

	async transformSales(locationId: number, sales: MokaSalesDetailRaw[], actorId: number) {
		return record('MokaTransformationService.transformSales', async () => {
			for (const sale of sales) {
				await this.syncSingleSale(locationId, sale, actorId)
			}
		})
	}

	private async syncSingleSale(locationId: number, sale: MokaSalesDetailRaw, actorId: number) {
		await this.db.transaction(async (tx) => {
			// 1. Idempotency check — skip if already synced by uuid
			const [existing] = await tx
				.select()
				.from(salesExternalRefsTable)
				.where(
					and(
						eq(salesExternalRefsTable.externalSource, 'moka'),
						eq(salesExternalRefsTable.externalOrderId, sale.uuid),
					),
				)

			if (existing) return

			// 2. Build void item uuid set for filtering
			const voidUuids = new Set((sale.void_items ?? []).map((vi) => vi.uuid))

			// 3. Filter out voided items from items[]
			const activeItems = (sale.items ?? []).filter((item) => !voidUuids.has(item.uuid))

			// 4. Skip empty orders (all items voided)
			if (activeItems.length === 0 && (sale.items ?? []).length > 0) return

			// 5. Determine sales type from payment_type_label
			const salesTypeName = sale.payment_type_label ?? 'Moka'
			const salesType = await this.ensureSalesTypeTx(tx, salesTypeName, actorId)
			if (!salesType) throw new Error('Failed to ensure sales type')

			// 6. Calculate amounts — use total_collected vs subtotal diff as tax
			const totalCollected = sale.total_collected_amount
			const subtotal = sale.subtotal
			const taxAmount = Math.max(0, totalCollected - subtotal)

			// 7. Insert Sales Order
			const [order] = await tx
				.insert(salesOrdersTable)
				.values({
					locationId,
					salesTypeId: salesType.id,
					source: 'moka',
					status: 'closed',
					transactionDate: new Date(sale.created_at),
					totalAmount: String(totalCollected),
					taxAmount: String(taxAmount),
					...stampCreate(actorId),
				})
				.returning()

			if (!order) throw new Error('Failed to create sales order')

			// 8. Link External Ref (with raw payload for audit trail)
			await tx.insert(salesExternalRefsTable).values({
				orderId: order.id,
				externalSource: 'moka',
				externalOrderId: sale.uuid,
				rawPayload: sale,
				...stampCreate(actorId),
			})

			// 9. Insert active items only (skip voided)
			for (const item of activeItems) {
				await this.insertSalesItem(tx, order.id, item, actorId)
			}

			// 10. Automated GL Posting
			await this.postSalesToGL(order.id, sale, actorId)
		})
	}

	private async insertSalesItem(
		tx: DbTx,
		orderId: number,
		item: MokaSalesItemRaw,
		actorId: number,
	) {
		// Try to find product mapping by Moka item_id
		const [mapping] = await tx
			.select()
			.from(productExternalMappingsTable)
			.where(
				and(
					eq(productExternalMappingsTable.provider, 'moka'),
					eq(productExternalMappingsTable.externalId, String(item.item_id)),
				),
			)

		await tx.insert(salesOrderItemsTable).values({
			orderId,
			productId: mapping?.productId ?? null,
			variantId: mapping?.variantId ?? null,
			itemName: item.item_name,
			quantity: String(item.quantity),
			unitPrice: String(item.price),
			subtotal: String(item.price * item.quantity),
			...stampCreate(actorId),
		})
	}

	private async postSalesToGL(orderId: number, sale: MokaSalesDetailRaw, actorId: number) {
		const cashAcc = await this.accountSvc.findByCode('1101')
		const salesAcc = await this.accountSvc.findByCode('4101')
		const taxAcc = await this.accountSvc.findByCode('2104')

		if (!cashAcc || !salesAcc || !taxAcc) {
			console.warn('Accounting accounts not initialized, skipping GL posting for sales')
			return
		}

		const netSales = sale.subtotal
		const taxAmount = Math.max(0, sale.total_collected_amount - sale.subtotal)
		const totalCollected = sale.total_collected_amount

		await this.journalSvc.postEntry(
			{
				date: new Date(sale.created_at),
				reference: `MOKA-SALE-${sale.payment_no}`,
				sourceType: 'sales',
				sourceId: orderId,
				note: `Automated posting from Moka Sales Sync (Payment ID: ${sale.payment_no})`,
				items: [
					{ accountId: cashAcc.id, debit: String(totalCollected), credit: '0' },
					{ accountId: salesAcc.id, debit: '0', credit: String(netSales) },
					{ accountId: taxAcc.id, debit: '0', credit: String(taxAmount) },
				],
			},
			actorId,
		)
	}

	/* ─── Helpers ───────────────────────────────────────────────────────────── */

	private async findProductMapping(externalId: string) {
		const result = await this.db
			.select()
			.from(productExternalMappingsTable)
			.where(
				and(
					eq(productExternalMappingsTable.provider, 'moka'),
					eq(productExternalMappingsTable.externalId, externalId),
					isNull(productExternalMappingsTable.variantId),
				),
			)
		return takeFirst(result)
	}

	private async resolveCategoryId(categoryName?: string): Promise<number | null> {
		if (!categoryName) return null

		const result = await this.db
			.select()
			.from(productCategoriesTable)
			.where(
				and(
					eq(productCategoriesTable.name, categoryName),
					isNull(productCategoriesTable.deletedAt),
				),
			)
		const cat = takeFirst(result)
		return cat?.id ?? null
	}

	private async ensureSalesType(name: string, actorId: number) {
		const result = await this.db
			.select()
			.from(salesTypesTable)
			.where(eq(salesTypesTable.name, name))
		const existing = takeFirst(result)
		if (existing) return existing

		const [created] = await this.db
			.insert(salesTypesTable)
			.values({
				code: name.toUpperCase().replaceAll(/\s+/g, '_'),
				name,
				isSystem: false,
				...stampCreate(actorId),
			})
			.returning()
		return created ?? null
	}

	private async ensureSalesTypeTx(tx: DbTx, name: string, actorId: number) {
		const result = await tx.select().from(salesTypesTable).where(eq(salesTypesTable.name, name))
		const existing = takeFirst(result)
		if (existing) return existing

		const [created] = await tx
			.insert(salesTypesTable)
			.values({
				code: name.toUpperCase().replaceAll(/\s+/g, '_'),
				name,
				isSystem: false,
				...stampCreate(actorId),
			})
			.returning()
		return created ?? null
	}

	private getDefaultPrice(variant: MokaItemVariantRaw | undefined): number {
		if (!variant) return 0
		// If product has sales_type_items, use the default sales type price
		const defaultSt = variant.sales_type_items?.find((st) => st.is_default)
		if (defaultSt) return defaultSt.sales_type_price
		// Otherwise use variant price directly
		return variant.price ?? 0
	}
}
