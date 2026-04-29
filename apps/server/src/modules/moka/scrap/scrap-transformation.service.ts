import { record } from '@elysiajs/opentelemetry'
import { and, eq, isNull } from 'drizzle-orm'

import { stampCreate, takeFirst, type DbClient, type DbTx } from '@/core/database'

import {
	categoryExternalMappingsTable,
	productCategoriesTable,
	productExternalMappingsTable,
	productPricesTable,
	productsTable,
	productVariantsTable,
	salesExternalRefsTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesTypesTable,
	salesVoidsTable,
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
	MokaSplitPaymentDetailRaw,
} from './scrap-raw.types'

export class MokaTransformationService {
	constructor(
		private readonly db: DbClient,
		private readonly accountSvc: AccountService,
		private readonly journalSvc: GeneralLedgerService,
	) {}

	/* ─── Category Sync ─────────────────────────────────────────────────────── */

	async transformCategories(
		_locationId: number,
		categories: MokaCategoryRaw[],
		actorId: number,
		outletId?: string | number | null,
	) {
		return record('MokaTransformationService.transformCategories', async () => {
			const outletNum = outletId ? Number(outletId) : null
			const filtered = outletNum ? categories.filter((c) => c.outlet_id === outletNum) : categories

			for (const cat of filtered) {
				const mapping = await this.findCategoryMapping(String(cat.id))

				if (cat.is_deleted) {
					// Soft-deleted in Moka — mark ERP category as inactive if mapped
					if (mapping) {
						await this.db
							.update(productCategoriesTable)
							.set({ deletedAt: new Date(), ...stampCreate(actorId) })
							.where(eq(productCategoriesTable.id, mapping.categoryId))
					}
					continue
				}

				if (mapping) {
					// Existing category — update name/description if changed
					await this.db
						.update(productCategoriesTable)
						.set({ name: cat.name, description: cat.description, ...stampCreate(actorId) })
						.where(eq(productCategoriesTable.id, mapping.categoryId))

					// Update mapping sync timestamp
					await this.db
						.update(categoryExternalMappingsTable)
						.set({ lastSyncedAt: new Date(), externalData: cat })
						.where(eq(categoryExternalMappingsTable.id, mapping.id))
				} else {
					// New category — check by name first to avoid duplicates
					const byName = await this.db
						.select()
						.from(productCategoriesTable)
						.where(
							and(
								eq(productCategoriesTable.name, cat.name),
								isNull(productCategoriesTable.deletedAt),
							),
						)
					const existingCat = takeFirst(byName)

					if (existingCat) {
						// Category exists by name — just create the mapping
						await this.db.insert(categoryExternalMappingsTable).values({
							categoryId: existingCat.id,
							provider: 'moka',
							externalId: String(cat.id),
							externalData: cat,
							lastSyncedAt: new Date(),
							...stampCreate(actorId),
						})
					} else {
						// Truly new — create category + mapping
						const [newCat] = await this.db
							.insert(productCategoriesTable)
							.values({ name: cat.name, description: cat.description, ...stampCreate(actorId) })
							.returning({ id: productCategoriesTable.id })

						if (newCat) {
							await this.db.insert(categoryExternalMappingsTable).values({
								categoryId: newCat.id,
								provider: 'moka',
								externalId: String(cat.id),
								externalData: cat,
								lastSyncedAt: new Date(),
								...stampCreate(actorId),
							})
						}
					}
				}
			}
		})
	}

	/* ─── Product Sync ───────────────────────────────────────────────────────── */

	async transformProducts(
		locationId: number,
		products: MokaProductRaw[],
		actorId: number,
		outletId?: string | number | null,
	) {
		return record('MokaTransformationService.transformProducts', async () => {
			const outletNum = outletId ? Number(outletId) : null
			const filtered = outletNum ? products.filter((p) => p.outlet_id === outletNum) : products

			for (const prod of filtered) {
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
					categoryId: await this.resolveCategoryId(prod.category_id, prod.category?.name),
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
			const categoryId = await this.resolveCategoryId(prod.category_id, prod.category?.name)

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

			// Multiple variants — lookup by external mapping first, fallback to name
			const variantMapping = await this.findVariantMapping(String(v.id))
			let existingVariantId: number | null = null

			if (variantMapping) {
				existingVariantId = variantMapping.variantId
				if (!existingVariantId) continue
				await this.db
					.update(productVariantsTable)
					.set({
						name: v.name ?? 'Default',
						sku: v.sku ?? null,
						basePrice: String(v.price ?? 0),
						...stampCreate(actorId),
					})
					.where(eq(productVariantsTable.id, existingVariantId))

				// Update mapping sync data
				await this.db
					.update(productExternalMappingsTable)
					.set({ lastSyncedAt: new Date() })
					.where(eq(productExternalMappingsTable.id, variantMapping.id))
			} else {
				// Fallback: lookup by name for previously synced variants without mapping
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
					existingVariantId = existingVariant.id
					await this.db
						.update(productVariantsTable)
						.set({
							name: v.name ?? 'Default',
							sku: v.sku ?? null,
							basePrice: String(v.price ?? 0),
							...stampCreate(actorId),
						})
						.where(eq(productVariantsTable.id, existingVariant.id))

					// Create mapping for existing variant
					await this.ensureVariantMapping(productId, existingVariant.id, v.id, actorId)
				} else {
					// Truly new variant
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
						existingVariantId = newVar.id
						await this.ensureVariantMapping(productId, newVar.id, v.id, actorId)
					}
				}
			}

			if (existingVariantId) {
				await this.syncSalesTypePrices(productId, existingVariantId, v, actorId)
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

	async transformSales(
		locationId: number,
		sales: MokaSalesDetailRaw[],
		actorId: number,
		outletId?: string | number | null,
	) {
		return record('MokaTransformationService.transformSales', async () => {
			const outletNum = outletId ? Number(outletId) : null
			const filtered = outletNum ? sales.filter((s) => s.outlet_id === outletNum) : sales

			for (const sale of filtered) {
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

			// 5. Determine sales type from first active item's sales_type_name (Dine In / Take Away)
			//    Payment method (Cash/Card) is NOT a sales type — it goes in metadata
			const firstItem = activeItems[0]
			const salesTypeName = firstItem?.sales_type_name ?? 'Default'
			const salesType = await this.ensureSalesTypeTx(tx, salesTypeName, actorId)
			if (!salesType) throw new Error('Failed to ensure sales type')

			// 6. Calculate amounts from order-level arrays (fallback to diff when arrays empty)
			const totalCollected = sale.total_collected_amount
			const subtotal = sale.subtotal
			const orderDiscount = (sale.order_discounts ?? []).reduce(
				(sum, d) => sum + (d.amount ?? 0),
				0,
			)
			const orderTax = (sale.order_taxes ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)
			const orderGratuity = (sale.order_gratuities ?? []).reduce(
				(sum, g) => sum + (g.amount ?? 0),
				0,
			)
			const orderRefund =
				sale.total_refund ?? (sale.order_refunds ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)
			const taxAmount = orderTax > 0 ? orderTax : Math.max(0, totalCollected - subtotal)

			// 7. Build metadata (split payment, payment type, Moka refs)
			const metadata = this.buildSalesMetadata(sale)

			// 8. Insert Sales Order
			const [order] = await tx
				.insert(salesOrdersTable)
				.values({
					locationId,
					salesTypeId: salesType.id,
					source: 'moka',
					status: 'closed',
					transactionDate: new Date(sale.created_at),
					totalAmount: String(totalCollected),
					discountAmount: String(orderDiscount),
					taxAmount: String(taxAmount),
					gratuityAmount: String(orderGratuity),
					refundAmount: String(orderRefund),
					metadata,
					...stampCreate(actorId),
				})
				.returning()

			if (!order) throw new Error('Failed to create sales order')

			// 9. Link External Ref (with raw payload for audit trail)
			await tx.insert(salesExternalRefsTable).values({
				orderId: order.id,
				externalSource: 'moka',
				externalOrderId: sale.uuid,
				rawPayload: sale,
				...stampCreate(actorId),
			})

			// 10. Insert active items only (skip voided)
			for (const item of activeItems) {
				await this.insertSalesItem(tx, order.id, item, actorId)
			}

			// 11. Record voided items for audit trail
			if (sale.void_items?.length) {
				for (const voidItem of sale.void_items) {
					await tx.insert(salesVoidsTable).values({
						orderId: order.id,
						itemId: null, // voided before ERP item creation
						reason: voidItem.void_reason ?? 'Moka void',
						voidedBy: actorId,
						metadata: {
							moka_uuid: voidItem.uuid,
							item_name: voidItem.item_name,
							void_by: voidItem.void_by,
							quantity: voidItem.quantity,
							price: voidItem.price,
						},
						...stampCreate(actorId),
					})
				}
			}

			// 12. Automated GL Posting
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

		const itemDiscount = (item.discounts ?? []).reduce((sum, d) => sum + (d.amount ?? 0), 0)
		const lineSubtotal = item.price * item.quantity - itemDiscount

		await tx.insert(salesOrderItemsTable).values({
			orderId,
			productId: mapping?.productId ?? null,
			variantId: mapping?.variantId ?? null,
			itemName: item.item_name,
			quantity: String(item.quantity),
			unitPrice: String(item.price),
			discountAmount: String(itemDiscount),
			subtotal: String(Math.max(0, lineSubtotal)),
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

		// Compute amounts from order-level data (same logic as syncSingleSale)
		const orderDiscount = (sale.order_discounts ?? []).reduce((sum, d) => sum + (d.amount ?? 0), 0)
		const orderTax = (sale.order_taxes ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)
		const orderGratuity = (sale.order_gratuities ?? []).reduce((sum, g) => sum + (g.amount ?? 0), 0)
		const orderRefund =
			sale.total_refund ?? (sale.order_refunds ?? []).reduce((sum, r) => sum + (r.amount ?? 0), 0)

		const netSales = Math.max(0, sale.subtotal - orderDiscount)
		const taxAmount =
			orderTax > 0 ? orderTax : Math.max(0, sale.total_collected_amount - sale.subtotal)
		const totalCollected = Math.max(0, sale.total_collected_amount - orderRefund)

		const paymentNarration = this.buildPaymentNarration(sale)

		await this.journalSvc.postEntry(
			{
				date: new Date(sale.created_at),
				reference: `MOKA-SALE-${sale.payment_no}`,
				sourceType: 'sales',
				sourceId: orderId,
				note: paymentNarration,
				items: [
					{ accountId: cashAcc.id, debit: String(totalCollected), credit: '0' },
					{ accountId: salesAcc.id, debit: '0', credit: String(netSales) },
					{ accountId: taxAcc.id, debit: '0', credit: String(taxAmount + orderGratuity) },
				],
			},
			actorId,
		)
	}

	/* ─── Helpers ───────────────────────────────────────────────────────────── */

	private async findCategoryMapping(externalId: string) {
		const result = await this.db
			.select()
			.from(categoryExternalMappingsTable)
			.where(
				and(
					eq(categoryExternalMappingsTable.provider, 'moka'),
					eq(categoryExternalMappingsTable.externalId, externalId),
				),
			)
		return takeFirst(result)
	}

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

	private async findVariantMapping(externalId: string) {
		const result = await this.db
			.select()
			.from(productExternalMappingsTable)
			.where(
				and(
					eq(productExternalMappingsTable.provider, 'moka'),
					eq(productExternalMappingsTable.externalId, externalId),
				),
			)
		return takeFirst(result)
	}

	private async resolveCategoryId(
		mokaCategoryId?: number,
		categoryName?: string,
	): Promise<number | null> {
		// 1. Try by Moka category ID via external mapping
		if (mokaCategoryId) {
			const mapping = await this.findCategoryMapping(String(mokaCategoryId))
			if (mapping) return mapping.categoryId
		}

		// 2. Fallback to name match
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

	private buildSalesMetadata(sale: MokaSalesDetailRaw): Record<string, unknown> {
		const metadata: Record<string, unknown> = {
			payment_type: sale.payment_type,
			payment_type_label: sale.payment_type_label,
			moka_outlet_id: sale.outlet_id,
			moka_payment_no: sale.payment_no,
			moka_order_id: sale.order_id,
			moka_guid: sale.guid,
		}

		if (sale.split_payment_details?.length) {
			metadata.is_split_payment = true
			metadata.split_payment_details = sale.split_payment_details.map(
				(d: MokaSplitPaymentDetailRaw) => ({
					payment_type: d.payment_type,
					payment_type_label: d.payment_type_label,
					collected_amount: d.collected_amount,
				}),
			)
		}

		return metadata
	}

	private buildPaymentNarration(sale: MokaSalesDetailRaw): string {
		const parts = [`Moka Sales #${sale.payment_no}`]

		if (sale.split_payment_details?.length) {
			const breakdown = sale.split_payment_details
				.map((d) => `${d.payment_type_label}: ${d.collected_amount}`)
				.join(', ')
			parts.push(`Split payment [${breakdown}]`)
		} else {
			parts.push(`Payment: ${sale.payment_type_label ?? sale.payment_type ?? 'unknown'}`)
		}

		if (sale.order_refunds?.length) {
			parts.push(`Refunded: yes`)
		}

		return parts.join(' | ')
	}
}
