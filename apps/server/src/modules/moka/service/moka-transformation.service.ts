import { and, eq } from 'drizzle-orm'

import { stampCreate, takeFirst } from '@/core/database'

import { db } from '@/db'
import {
	productCategoriesTable,
	productExternalMappingsTable,
	productsTable,
	productVariantsTable,
	salesExternalRefsTable,
	salesOrderItemsTable,
	salesOrdersTable,
	salesTypesTable,
} from '@/db/schema'

import type { AccountService } from '@/modules/finance'
import type { GeneralLedgerService } from '@/modules/finance'
import type { MokaCategoryRaw, MokaProductRaw, MokaSalesDetailRaw } from '../dto/moka-raw.types'

export class MokaTransformationService {
	constructor(
		private readonly accountSvc: AccountService,
		private readonly journalSvc: GeneralLedgerService,
	) {}

	async transformCategories(_locationId: number, categories: MokaCategoryRaw[], actorId: number) {
		for (const cat of categories) {
			const result = await db
				.select()
				.from(productCategoriesTable)
				.where(eq(productCategoriesTable.name, cat.name))
			const existing = takeFirst(result)

			if (!existing) {
				await db.insert(productCategoriesTable).values({ name: cat.name, ...stampCreate(actorId) })
			}
		}
	}

	async transformProducts(locationId: number, products: MokaProductRaw[], actorId: number) {
		for (const prod of products) {
			const result = await db
				.select()
				.from(productExternalMappingsTable)
				.where(
					and(
						eq(productExternalMappingsTable.provider, 'moka'),
						eq(productExternalMappingsTable.externalId, String(prod.id)),
					),
				)
			const mapping = takeFirst(result)

			if (mapping) {
				await db
					.update(productExternalMappingsTable)
					.set({ lastSyncedAt: new Date(), externalData: prod })
					.where(eq(productExternalMappingsTable.id, mapping.id))
			} else {
				const [newProd] = await db
					.insert(productsTable)
					.values({
						name: prod.name,
						sku: prod.item_variants[0]?.sku ?? `MOKA-${prod.id}`,
						locationId,
						status: 'active',
						basePrice: String(prod.item_variants[0]?.price ?? 0),
						hasVariants: prod.item_variants.length > 1,
						...stampCreate(actorId),
					})
					.returning({ id: productsTable.id })

				if (newProd) {
					await db.insert(productExternalMappingsTable).values({
						productId: newProd.id,
						provider: 'moka',
						externalId: String(prod.id),
						externalData: prod,
						lastSyncedAt: new Date(),
						...stampCreate(actorId),
					})

					if (prod.item_variants.length > 1) {
						for (const v of prod.item_variants) {
							await db.insert(productVariantsTable).values({
								productId: newProd.id,
								name: v.name,
								sku: v.sku,
								basePrice: String(v.price),
								isDefault: false,
								...stampCreate(actorId),
							})
						}
					}
				}
			}
		}
	}

	async transformSales(locationId: number, sales: MokaSalesDetailRaw[], actorId: number) {
		for (const sale of sales) {
			await this.syncSingleSale(locationId, sale, actorId)
		}
	}

	private async syncSingleSale(locationId: number, sale: MokaSalesDetailRaw, actorId: number) {
		await db.transaction(async (tx) => {
			// 1. Check if already synced
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

			// 2. Map Sales Type (or create default)
			const salesTypeName = sale.payment_type_label ?? 'Moka'
			let [salesType] = await tx
				.select()
				.from(salesTypesTable)
				.where(eq(salesTypesTable.name, salesTypeName))

			if (!salesType) {
				const [newType] = await tx
					.insert(salesTypesTable)
					.values({
						code: salesTypeName.toUpperCase().replaceAll(/\s+/g, '_'),
						name: salesTypeName,
						isSystem: false,
						...stampCreate(actorId),
					})
					.returning()
				salesType = newType
			}

			if (!salesType) throw new Error('Failed to ensure sales type')

			// 3. Insert Sales Order
			const [order] = await tx
				.insert(salesOrdersTable)
				.values({
					locationId,
					salesTypeId: salesType.id,
					status: 'closed',
					transactionDate: new Date(sale.created_at),
					totalAmount: String(sale.total_collected_amount),
					taxAmount: String(sale.subtotal * 0.1),
					...stampCreate(actorId),
				})
				.returning()

			if (!order) throw new Error('Failed to create sales order')

			// 4. Link External Ref
			await tx.insert(salesExternalRefsTable).values({
				orderId: order.id,
				externalSource: 'moka',
				externalOrderId: sale.uuid,
				rawPayload: sale,
				...stampCreate(actorId),
			})

			// 5. Insert Items
			for (const item of sale.items) {
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
					orderId: order.id,
					productId: mapping?.productId,
					variantId: mapping?.variantId,
					itemName: item.item_name,
					quantity: String(item.quantity),
					unitPrice: String(item.price),
					subtotal: String(item.price * item.quantity),
					...stampCreate(actorId),
				})
			}

			// 6. Automated General Ledger Posting (FIN-02)
			await this.postSalesToGL(order.id, sale, actorId)
		})
	}

	private async postSalesToGL(orderId: number, sale: MokaSalesDetailRaw, actorId: number) {
		// Lookup accounts
		const cashAcc = await this.accountSvc.findByCode('1101') // Cash
		const salesAcc = await this.accountSvc.findByCode('4101') // Sales Revenue
		const taxAcc = await this.accountSvc.findByCode('2104') // Taxes Payable

		if (!cashAcc || !salesAcc || !taxAcc) {
			console.warn('Accounting accounts not initialized, skipping GL posting for sales')
			return
		}

		const netSales = sale.subtotal
		const taxAmount = sale.subtotal * 0.1 // Simplified Tax logic
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
}
